import { useMemo, useReducer, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import {
  calculateConfigurationPriceMinor,
  canonicalizeCartConfiguration,
  cartConfigurationFingerprint,
  createDefaultModifierSelections,
  summarizeCartConfiguration,
  validateCartConfiguration,
} from '../../cart/model/cartConfiguration';
import {
  addConfiguration,
  editConfiguration,
} from '../../cart/model/cartSlice';
import type {
  CartConfiguration,
  ModifierSelection,
} from '../../cart/model/cart.types';
import { useAppDispatch, useAppSelector } from '../../../redux/hooks';
import { formatMinorMoney } from '../../../shared/lib/money';
import { useLocale } from '../../../shared/i18n/useLocale';
import type {
  DoughType,
  PizzaSizeCm,
  ProductDetails,
} from '../model/product.types';
import {
  getDoughLabel,
  PIZZA_DOUGHS,
  PIZZA_SIZES,
  findProductVariant,
  getVariantIssue,
} from '../model/variant';

interface PizzaConfiguratorProps {
  details: ProductDetails;
  returnTo: string;
  editFingerprint?: string;
}

interface ConfiguratorDraft {
  sizeCm: PizzaSizeCm;
  dough: DoughType;
  removedIngredientIds: string[];
  modifierSelections: ModifierSelection[];
}

type DraftAction =
  | { type: 'set-size'; sizeCm: PizzaSizeCm }
  | { type: 'set-dough'; dough: DoughType }
  | { type: 'toggle-removal'; ingredientId: string }
  | { type: 'select-single'; groupId: string; modifierId: string }
  | { type: 'toggle-multiple'; groupId: string; modifierId: string };

const updateGroup = (
  selections: readonly ModifierSelection[],
  groupId: string,
  modifierIds: string[],
): ModifierSelection[] => [
  ...selections.filter((selection) => selection.groupId !== groupId),
  ...(modifierIds.length > 0 ? [{ groupId, modifierIds }] : []),
];

const draftReducer = (
  state: ConfiguratorDraft,
  action: DraftAction,
): ConfiguratorDraft => {
  if (action.type === 'set-size') {
    return { ...state, sizeCm: action.sizeCm };
  }
  if (action.type === 'set-dough') {
    return { ...state, dough: action.dough };
  }
  if (action.type === 'toggle-removal') {
    return {
      ...state,
      removedIngredientIds: state.removedIngredientIds.includes(action.ingredientId)
        ? state.removedIngredientIds.filter((id) => id !== action.ingredientId)
        : [...state.removedIngredientIds, action.ingredientId],
    };
  }
  if (action.type === 'select-single') {
    return {
      ...state,
      modifierSelections: updateGroup(
        state.modifierSelections,
        action.groupId,
        [action.modifierId],
      ),
    };
  }

  const selected =
    state.modifierSelections.find(
      (selection) => selection.groupId === action.groupId,
    )?.modifierIds ?? [];
  return {
    ...state,
    modifierSelections: updateGroup(
      state.modifierSelections,
      action.groupId,
      selected.includes(action.modifierId)
        ? selected.filter((id) => id !== action.modifierId)
        : [...selected, action.modifierId],
    ),
  };
};

interface InitialDraftArgs {
  details: ProductDetails;
  configuration?: CartConfiguration;
}

const createInitialDraft = ({
  details,
  configuration,
}: InitialDraftArgs): ConfiguratorDraft => {
  const variant = configuration
    ? details.variants.find((item) => item.id === configuration.variantId)
    : undefined;
  if (
    configuration?.productId === details.product.id &&
    variant?.sizeCm &&
    variant.dough
  ) {
    return {
      sizeCm: variant.sizeCm,
      dough: variant.dough,
      removedIngredientIds: [...configuration.removedIngredientIds],
      modifierSelections: configuration.modifierSelections.map((selection) => ({
        groupId: selection.groupId,
        modifierIds: [...selection.modifierIds],
      })),
    };
  }

  return {
    sizeCm: 25,
    dough: 'thin',
    removedIngredientIds: [],
    modifierSelections: createDefaultModifierSelections(details),
  };
};

export function PizzaConfigurator({
  details,
  returnTo,
  editFingerprint,
}: PizzaConfiguratorProps) {
  const appDispatch = useAppDispatch();
  const { locale, t } = useLocale();
  const navigate = useNavigate();
  const editingLine = useAppSelector((state) =>
    editFingerprint
      ? state.cart.lines.find((line) => line.fingerprint === editFingerprint)
      : undefined,
  );
  const isEditing = Boolean(editFingerprint && editingLine);
  const [draft, dispatch] = useReducer(
    draftReducer,
    { details, configuration: editingLine?.configuration },
    createInitialDraft,
  );
  const [modifierScenario, setModifierScenario] = useState<
    'default' | 'extra-cheese-unavailable'
  >('default');
  const [announcement, setAnnouncement] = useState('');
  const { product, variants } = details;
  const selectedVariant = findProductVariant(
    variants,
    draft.sizeCm,
    draft.dough,
  );
  const effectiveDetails = useMemo<ProductDetails>(
    () => ({
      ...details,
      modifiers: details.modifiers.map((modifier) =>
        modifierScenario === 'extra-cheese-unavailable' &&
        modifier.id === 'extra-cheese'
          ? {
              ...modifier,
              available: false,
              unavailableReason:
                t('Дополнительный сыр закончился. Выберите обычный или растительный сыр.', 'Extra cheese is sold out. Choose standard or plant-based cheese.'),
            }
          : modifier,
      ),
    }),
    [details, modifierScenario, t],
  );
  const configuration = useMemo<CartConfiguration>(
    () =>
      canonicalizeCartConfiguration({
        productId: product.id,
        variantId: selectedVariant?.id ?? '',
        removedIngredientIds: draft.removedIngredientIds,
        modifierSelections: draft.modifierSelections,
      }),
    [draft.modifierSelections, draft.removedIngredientIds, product.id, selectedVariant?.id],
  );
  const configurationIssues = validateCartConfiguration(
    configuration,
    effectiveDetails,
    locale,
  );
  const variantIssue = getVariantIssue(
    variants,
    draft.sizeCm,
    draft.dough,
    locale,
  );
  const productIssue =
    product.availability.status === 'sold-out'
      ? product.availability.note
      : null;
  const firstIssue = productIssue
    ? { fieldId: 'product-availability', message: productIssue }
    : variantIssue
      ? { fieldId: 'pizza-dough-group', message: variantIssue }
      : configurationIssues[0] ?? null;
  const canAdd = !firstIssue && configurationIssues.length === 0;
  const priceMinor = selectedVariant
    ? calculateConfigurationPriceMinor(configuration, effectiveDetails)
    : null;
  const summary = selectedVariant
    ? summarizeCartConfiguration(configuration, effectiveDetails, locale)
    : [];
  const removableRelations = details.productIngredients.filter(
    (relation) => relation.removable,
  );

  const addToCart = () => {
    if (!canAdd || priceMinor === null) {
      return;
    }
    if (isEditing && editFingerprint) {
      appDispatch(editConfiguration({ sourceFingerprint: editFingerprint, configuration }));
      const nextFingerprint = cartConfigurationFingerprint(configuration);
      navigate(`/cart#cart-line-${nextFingerprint}`, {
        replace: true,
        state: { returnTo: '/menu' },
      });
      return;
    }

    appDispatch(addConfiguration(configuration));
    setAnnouncement(
      locale === 'ru'
        ? `${product.name}: конфигурация добавлена в корзину за ${formatMinorMoney(priceMinor)} ₽.`
        : `${product.name}: configuration added to cart for ${formatMinorMoney(priceMinor)} ₽.`,
    );
  };

  return (
    <div className="product-configurator">
      <fieldset id="pizza-size-group">
        <legend>{t('Размер', 'Size')}</legend>
        <div className="choice-grid choice-grid--sizes">
          {PIZZA_SIZES.map((size) => {
            const availableVariant = variants.find(
              (variant) => variant.sizeCm === size && variant.available,
            );
            return (
              <label key={size}>
                <input
                  type="radio"
                  name="pizza-size"
                  value={size}
                  checked={draft.sizeCm === size}
                  onChange={() => {
                    dispatch({ type: 'set-size', sizeCm: size });
                    setAnnouncement('');
                  }}
                />
                <span>{size} {t('см', 'cm')}</span>
                <small>
                  {availableVariant
                    ? `${t('от', 'from')} ${formatMinorMoney(availableVariant.basePriceMinor)} ₽`
                    : t('нет в наличии', 'sold out')}
                </small>
              </label>
            );
          })}
        </div>
      </fieldset>

      <fieldset id="pizza-dough-group">
        <legend>{t('Тесто', 'Dough')}</legend>
        <div className="choice-grid">
          {PIZZA_DOUGHS.map((doughType) => {
            const variant = findProductVariant(variants, draft.sizeCm, doughType);
            const disabled = !variant || !variant.available;
            return (
              <label key={doughType} aria-disabled={disabled}>
                <input
                  type="radio"
                  name="pizza-dough"
                  value={doughType}
                  checked={draft.dough === doughType}
                  disabled={disabled}
                  onChange={() => {
                    dispatch({ type: 'set-dough', dough: doughType });
                    setAnnouncement('');
                  }}
                />
                <span>{getDoughLabel(doughType, locale)}</span>
                <small>{doughType === 'thin' ? t('тонкий центр', 'thin center') : t('пышный борт', 'airy crust')}</small>
              </label>
            );
          })}
        </div>
      </fieldset>

      {removableRelations.length > 0 ? (
        <fieldset id="removable-ingredients-group">
          <legend>{t('Убрать из состава', 'Remove ingredients')}</legend>
          <p className="fieldset-hint">{t('Цена не меняется. Убираем только отмеченные ингредиенты этого продукта.', 'The price does not change. Only ingredients marked as removable can be removed.')}</p>
          <div className="configuration-options">
            {removableRelations.map((relation) => {
              const ingredient = details.ingredients.find(
                (item) => item.id === relation.ingredientId,
              );
              if (!ingredient) return null;
              return (
                <label key={ingredient.id}>
                  <input
                    type="checkbox"
                    checked={draft.removedIngredientIds.includes(ingredient.id)}
                    onChange={() => {
                      dispatch({ type: 'toggle-removal', ingredientId: ingredient.id });
                      setAnnouncement('');
                    }}
                  />
                  <span>{t('Убрать', 'Remove')} {ingredient.name.toLocaleLowerCase(locale)}</span>
                  <small>{t('без изменения цены', 'no price change')}</small>
                </label>
              );
            })}
          </div>
        </fieldset>
      ) : null}

      <div id="modifier-groups" className="modifier-groups">
        {effectiveDetails.modifierGroups.map((group) => {
          const selectedIds =
            draft.modifierSelections.find(
              (selection) => selection.groupId === group.id,
            )?.modifierIds ?? [];
          const maxReached = selectedIds.length >= group.max;
          const singleChoice = group.max === 1;

          return (
            <fieldset id={`modifier-group-${group.id}`} key={group.id}>
              <legend>{group.name}{group.required ? ` · ${t('обязательно', 'required')}` : ''}</legend>
              <p className="fieldset-hint">
                {singleChoice
                  ? t('Выберите один вариант.', 'Choose one option.')
                  : `${t('Можно выбрать до', 'Choose up to')} ${group.max}.`}
              </p>
              <div className="configuration-options">
                {group.modifierIds.map((modifierId) => {
                  const modifier = effectiveDetails.modifiers.find(
                    (item) => item.id === modifierId,
                  );
                  if (!modifier) return null;
                  const selected = selectedIds.includes(modifier.id);
                  const disabled =
                    (!modifier.available && !selected) ||
                    (!singleChoice && maxReached && !selected);
                  return (
                    <label key={modifier.id} aria-disabled={disabled}>
                      <input
                        type={singleChoice ? 'radio' : 'checkbox'}
                        name={singleChoice ? `modifier-${group.id}` : undefined}
                        checked={selected}
                        disabled={disabled}
                        onChange={() => {
                          dispatch(
                            singleChoice
                              ? { type: 'select-single', groupId: group.id, modifierId: modifier.id }
                              : { type: 'toggle-multiple', groupId: group.id, modifierId: modifier.id },
                          );
                          setAnnouncement('');
                        }}
                      />
                      <span>{modifier.name}</span>
                      <small>
                        {!modifier.available
                          ? modifier.unavailableReason
                          : modifier.priceDeltaMinor === 0
                            ? t('без доплаты', 'included')
                            : `+${formatMinorMoney(modifier.priceDeltaMinor)} ₽`}
                      </small>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          );
        })}
      </div>

      <details className="demo-controls product-demo-controls">
        <summary>{t('Проверить доступность добавок', 'Test add-on availability')}</summary>
        <div>
          <label htmlFor="modifier-scenario">{t('Демо-сценарий', 'Demo scenario')}</label>
          <select
            id="modifier-scenario"
            value={modifierScenario}
            onChange={(event) =>
              setModifierScenario(
                event.target.value as typeof modifierScenario,
              )
            }>
            <option value="default">{t('Все выбранные добавки доступны', 'All selected add-ons are available')}</option>
            <option value="extra-cheese-unavailable">{t('Дополнительный сыр закончился', 'Extra cheese is sold out')}</option>
          </select>
          <p>{t('Сценарий меняет только доступность добавки и не сохраняется.', 'This scenario changes add-on availability only and is not saved.')}</p>
        </div>
      </details>

      <div
        className="configuration-summary"
        role="status"
        aria-label={t('Текущая конфигурация и цена', 'Current configuration and price')}
        aria-live="polite"
        aria-atomic="true">
        <div>
          <span>{t('Ваш вариант', 'Your selection')}</span>
          {summary.length > 0 ? (
            <ul>{summary.map((item) => <li key={item}>{item}</li>)}</ul>
          ) : (
            <p>{t('Выберите доступное сочетание', 'Choose an available combination')}</p>
          )}
        </div>
        {priceMinor !== null ? <strong>{formatMinorMoney(priceMinor)} ₽</strong> : null}
      </div>

      {firstIssue ? (
        <div className="configuration-issue" role="alert">
          <strong>{t('Исправьте конфигурацию', 'Fix the configuration')}</strong>
          <p>{firstIssue.message}</p>
          <a href={`#${firstIssue.fieldId}`}>{t('Перейти к выбору', 'Go to selection')}</a>
        </div>
      ) : null}

      <div className="product-sticky-cta" data-sticky-cta>
        <button type="button" disabled={!canAdd} onClick={addToCart}>
          {priceMinor !== null
            ? `${isEditing ? t('Сохранить изменения', 'Save changes') : t('Добавить', 'Add')} ${t('за', 'for')} ${formatMinorMoney(priceMinor)} ₽`
            : t('Выберите доступный вариант', 'Choose an available option')}
        </button>
        {announcement && !isEditing ? (
          <Link className="secondary-link" to="/cart" state={{ returnTo }}>
            {t('Открыть корзину', 'Open cart')}
          </Link>
        ) : null}
      </div>
      <p className="visually-hidden" role="status" aria-live="polite">
        {announcement}
      </p>
    </div>
  );
}
