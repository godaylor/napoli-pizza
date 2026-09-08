import type { ProductDetails } from '../../product/model/product.types';
import { formatVariantSummary } from '../../product/model/variant';
import type {
  CartConfiguration,
  ModifierSelection,
} from './cart.types';
import type { Locale } from '../../../shared/i18n/locale';

export interface ConfigurationIssue {
  code:
    | 'variant'
    | 'removal'
    | 'group-min'
    | 'group-max'
    | 'modifier'
    | 'modifier-unavailable';
  fieldId: string;
  message: string;
}

const sortedUnique = (values: readonly string[]): string[] =>
  [...new Set(values)].sort((left, right) => left.localeCompare(right, 'en'));

export const canonicalizeCartConfiguration = (
  configuration: CartConfiguration,
): CartConfiguration => {
  const selectionsByGroup = new Map<string, string[]>();

  for (const selection of configuration.modifierSelections) {
    selectionsByGroup.set(selection.groupId, [
      ...(selectionsByGroup.get(selection.groupId) ?? []),
      ...selection.modifierIds,
    ]);
  }

  const modifierSelections: ModifierSelection[] = [...selectionsByGroup]
    .map(([groupId, modifierIds]) => ({
      groupId,
      modifierIds: sortedUnique(modifierIds),
    }))
    .filter((selection) => selection.modifierIds.length > 0)
    .sort((left, right) => left.groupId.localeCompare(right.groupId, 'en'));

  return {
    productId: configuration.productId,
    variantId: configuration.variantId,
    removedIngredientIds: sortedUnique(configuration.removedIngredientIds),
    modifierSelections,
  };
};

export const serializeCartConfiguration = (
  configuration: CartConfiguration,
): string => JSON.stringify(canonicalizeCartConfiguration(configuration));

export const cartConfigurationFingerprint = (
  configuration: CartConfiguration,
): string => {
  const serialized = serializeCartConfiguration(configuration);
  let hash = 0x811c9dc5;

  for (let index = 0; index < serialized.length; index += 1) {
    hash ^= serialized.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }

  return `cfg1-${(hash >>> 0).toString(16).padStart(8, '0')}`;
};

export const createDefaultModifierSelections = (
  details: ProductDetails,
): ModifierSelection[] =>
  details.modifierGroups.flatMap((group) => {
    if (group.min === 0) {
      return [];
    }

    const available = group.modifierIds.filter((modifierId) =>
      details.modifiers.some(
        (modifier) => modifier.id === modifierId && modifier.available,
      ),
    );

    return available.length >= group.min
      ? [{ groupId: group.id, modifierIds: available.slice(0, group.min) }]
      : [];
  });

export const validateCartConfiguration = (
  configuration: CartConfiguration,
  details: ProductDetails,
  locale: Locale = 'ru',
): ConfigurationIssue[] => {
  const canonical = canonicalizeCartConfiguration(configuration);
  const issues: ConfigurationIssue[] = [];
  const variant = details.variants.find(
    (item) =>
      item.id === canonical.variantId && item.productId === canonical.productId,
  );

  if (!variant || !variant.available) {
    issues.push({
      code: 'variant',
      fieldId: 'pizza-size-group',
      message:
        variant?.unavailableReason ??
        (locale === 'ru' ? 'Выберите доступное сочетание размера и теста.' : 'Choose an available size and dough combination.'),
    });
  }

  for (const ingredientId of canonical.removedIngredientIds) {
    const relation = details.productIngredients.find(
      (item) =>
        item.productId === canonical.productId &&
        item.ingredientId === ingredientId,
    );
    if (!relation?.removable) {
      const ingredient = details.ingredients.find((item) => item.id === ingredientId);
      issues.push({
        code: 'removal',
        fieldId: 'removable-ingredients-group',
        message: locale === 'ru'
          ? `${ingredient?.name ?? 'Этот ингредиент'} нельзя убрать из выбранного продукта.`
          : `${ingredient?.name ?? 'This ingredient'} cannot be removed from this product.`,
      });
    }
  }

  const groupById = new Map(
    details.modifierGroups.map((group) => [group.id, group]),
  );
  const modifierById = new Map(
    details.modifiers.map((modifier) => [modifier.id, modifier]),
  );
  const selectionByGroup = new Map(
    canonical.modifierSelections.map((selection) => [
      selection.groupId,
      selection.modifierIds,
    ]),
  );

  for (const selection of canonical.modifierSelections) {
    if (!groupById.has(selection.groupId)) {
      issues.push({
        code: 'modifier',
        fieldId: 'modifier-groups',
        message: locale === 'ru' ? 'Удалите неизвестную группу добавок.' : 'Remove the unknown add-on group.',
      });
    }
  }

  for (const group of details.modifierGroups) {
    const selectedIds = selectionByGroup.get(group.id) ?? [];
    const fieldId = `modifier-group-${group.id}`;

    if (selectedIds.length < group.min) {
      issues.push({
        code: 'group-min',
        fieldId,
        message: locale === 'ru' ? `Выберите минимум ${group.min} вариант в группе «${group.name}».` : `Choose at least ${group.min} option in “${group.name}”.`,
      });
    }
    if (selectedIds.length > group.max) {
      issues.push({
        code: 'group-max',
        fieldId,
        message: locale === 'ru' ? `В группе «${group.name}» можно выбрать не больше ${group.max}.` : `Choose no more than ${group.max} options in “${group.name}”.`,
      });
    }

    for (const modifierId of selectedIds) {
      const modifier = modifierById.get(modifierId);
      if (!group.modifierIds.includes(modifierId) || !modifier) {
        issues.push({
          code: 'modifier',
          fieldId,
          message: locale === 'ru' ? `Выберите добавку из группы «${group.name}».` : `Choose an add-on from “${group.name}”.`,
        });
      } else if (!modifier.available) {
        issues.push({
          code: 'modifier-unavailable',
          fieldId,
          message:
            modifier.unavailableReason ??
            (locale === 'ru' ? `${modifier.name} временно недоступен. Выберите другой вариант.` : `${modifier.name} is temporarily unavailable. Choose another option.`),
        });
      }
    }
  }

  return issues;
};

export const calculateConfigurationPriceMinor = (
  configuration: CartConfiguration,
  details: ProductDetails,
): number => {
  const canonical = canonicalizeCartConfiguration(configuration);
  const variant = details.variants.find(
    (item) => item.id === canonical.variantId,
  );
  if (!variant) {
    throw new RangeError('Cannot price an unknown product variant.');
  }

  const modifierById = new Map(
    details.modifiers.map((modifier) => [modifier.id, modifier]),
  );
  let total = variant.basePriceMinor;

  for (const modifierId of canonical.modifierSelections.flatMap(
    (selection) => selection.modifierIds,
  )) {
    const modifier = modifierById.get(modifierId);
    if (!modifier || !Number.isSafeInteger(modifier.priceDeltaMinor)) {
      throw new RangeError('Cannot price an unknown or malformed modifier.');
    }
    total += modifier.priceDeltaMinor;
  }

  if (!Number.isSafeInteger(total) || total < 0) {
    throw new RangeError('Configuration price must be a non-negative integer.');
  }

  return total;
};

export const summarizeCartConfiguration = (
  configuration: CartConfiguration,
  details: ProductDetails,
  locale: Locale = 'ru',
): string[] => {
  const canonical = canonicalizeCartConfiguration(configuration);
  const variant = details.variants.find(
    (item) => item.id === canonical.variantId,
  );
  const ingredientById = new Map(
    details.ingredients.map((ingredient) => [ingredient.id, ingredient]),
  );
  const modifierById = new Map(
    details.modifiers.map((modifier) => [modifier.id, modifier]),
  );
  const summary = variant ? [formatVariantSummary(variant, locale)] : [];

  summary.push(
    ...canonical.removedIngredientIds.map(
      (ingredientId) =>
        `${locale === 'ru' ? 'Без' : 'No'} ${ingredientById.get(ingredientId)?.removalLabel ?? ingredientId}`,
    ),
  );
  summary.push(
    ...canonical.modifierSelections.flatMap((selection) =>
      selection.modifierIds.map(
        (modifierId) => modifierById.get(modifierId)?.name ?? modifierId,
      ),
    ),
  );

  return summary;
};
