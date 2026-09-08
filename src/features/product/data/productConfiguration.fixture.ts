import type { CatalogProduct } from '../../catalog/model/catalog.types';
import { getProductVariants } from './productVariants.fixture';

import type {
  Ingredient,
  Modifier,
  ModifierGroup,
  ProductDetails,
  ProductIngredient,
} from '../model/product.types';
import type { Locale } from '../../../shared/i18n/locale';
import {
  localizeIngredients,
  localizeModifierGroups,
  localizeModifiers,
  localizeVariants,
} from './productLocalization';

export const INGREDIENTS: Ingredient[] = [
  { id: 'tomato', name: 'Томаты', removalLabel: 'томатов', searchAliases: ['пелати'], allergens: [] },
  { id: 'mozzarella', name: 'Моцарелла', removalLabel: 'моцареллы', searchAliases: ['сыр'], allergens: ['молоко'] },
  { id: 'parmesan', name: 'Пармезан', removalLabel: 'пармезана', searchAliases: ['сыр'], allergens: ['молоко'] },
  { id: 'basil', name: 'Базилик', removalLabel: 'базилика', searchAliases: ['зелень'], allergens: [] },
  { id: 'oregano', name: 'Орегано', removalLabel: 'орегано', searchAliases: ['специи'], allergens: [] },
  { id: 'pepperoni', name: 'Пепперони', removalLabel: 'пепперони', searchAliases: ['салями'], allergens: [] },
  { id: 'red-onion', name: 'Красный лук', removalLabel: 'красного лука', searchAliases: ['лук'], allergens: [] },
  { id: 'mortadella', name: 'Мортаделла', removalLabel: 'мортаделлы', searchAliases: [], allergens: [] },
  { id: 'stracciatella', name: 'Страчателла', removalLabel: 'страчателлы', searchAliases: ['сыр'], allergens: ['молоко'] },
  { id: 'pistachio', name: 'Фисташка', removalLabel: 'фисташки', searchAliases: ['орехи'], allergens: ['орехи'] },
  { id: 'mushrooms', name: 'Грибы', removalLabel: 'грибов', searchAliases: ['шампиньоны', 'вешенки'], allergens: [] },
  { id: 'truffle', name: 'Трюфельный крем', removalLabel: 'трюфельного крема', searchAliases: ['трюфель'], allergens: ['молоко'] },
  { id: 'gorgonzola', name: 'Горгонзола', removalLabel: 'горгонзолы', searchAliases: ['сыр'], allergens: ['молоко'] },
  { id: 'salami', name: 'Острая салями', removalLabel: 'острой салями', searchAliases: [], allergens: [] },
  { id: 'nduja', name: 'Nduja', removalLabel: 'nduja', searchAliases: ['колбаса'], allergens: [] },
  { id: 'jalapeno', name: 'Халапеньо', removalLabel: 'халапеньо', searchAliases: ['перец'], allergens: [] },
  { id: 'prosciutto', name: 'Прошутто', removalLabel: 'прошутто', searchAliases: ['ветчина'], allergens: [] },
  { id: 'arugula', name: 'Руккола', removalLabel: 'рукколы', searchAliases: ['зелень'], allergens: [] },
  { id: 'eggplant', name: 'Баклажан', removalLabel: 'баклажана', searchAliases: [], allergens: [] },
  { id: 'ricotta', name: 'Рикотта', removalLabel: 'рикотты', searchAliases: ['сыр'], allergens: ['молоко'] },
  { id: 'pecorino', name: 'Пекорино', removalLabel: 'пекорино', searchAliases: ['сыр'], allergens: ['молоко'] },
  { id: 'chicken', name: 'Курица', removalLabel: 'курицы', searchAliases: [], allergens: [] },
  { id: 'pesto', name: 'Песто', removalLabel: 'песто', searchAliases: ['базилик'], allergens: ['молоко', 'орехи'] },
  { id: 'zucchini', name: 'Цукини', removalLabel: 'цукини', searchAliases: ['кабачок'], allergens: [] },
  { id: 'sausage', name: 'Сальсичча', removalLabel: 'сальсиччи', searchAliases: ['колбаска'], allergens: [] },
  { id: 'potato', name: 'Картофель', removalLabel: 'картофеля', searchAliases: [], allergens: [] },
  { id: 'rosemary', name: 'Розмарин', removalLabel: 'розмарина', searchAliases: [], allergens: [] },
  { id: 'garlic', name: 'Чеснок', removalLabel: 'чеснока', searchAliases: [], allergens: [] },
  { id: 'bell-pepper', name: 'Сладкий перец', removalLabel: 'сладкого перца', searchAliases: [], allergens: [] },
  { id: 'burrata', name: 'Буррата', removalLabel: 'бурраты', searchAliases: ['сыр'], allergens: ['молоко'] },
  { id: 'guanciale', name: 'Гуанчале', removalLabel: 'гуанчале', searchAliases: ['бекон'], allergens: [] },
  { id: 'egg', name: 'Желток', removalLabel: 'желтка', searchAliases: ['яйцо'], allergens: ['яйцо'] },
  { id: 'tuna', name: 'Тунец', removalLabel: 'тунца', searchAliases: ['рыба'], allergens: ['рыба'] },
  { id: 'capers', name: 'Каперсы', removalLabel: 'каперсов', searchAliases: [], allergens: [] },
];

const relations = (
  productId: string,
  values: ReadonlyArray<readonly [ingredientId: string, removable: boolean]>,
): ProductIngredient[] =>
  values.map(([ingredientId, removable]) => ({ productId, ingredientId, removable }));

export const PRODUCT_INGREDIENTS: ProductIngredient[] = [
  ...relations('101', [['tomato', false], ['mozzarella', false], ['parmesan', true], ['basil', true]]),
  ...relations('102', [['tomato', false], ['mozzarella', false], ['pepperoni', false], ['red-onion', true], ['oregano', true]]),
  ...relations('103', [['mortadella', false], ['stracciatella', false], ['pistachio', true]]),
  ...relations('104', [['mushrooms', true], ['mozzarella', false], ['truffle', true]]),
  ...relations('105', [['mozzarella', false], ['gorgonzola', true], ['parmesan', true]]),
  ...relations('106', [['salami', false], ['nduja', true], ['tomato', false], ['mozzarella', false], ['jalapeno', true]]),
  ...relations('107', [['prosciutto', true], ['arugula', true], ['tomato', false], ['mozzarella', false], ['parmesan', true]]),
  ...relations('108', [['eggplant', true], ['tomato', false], ['ricotta', true], ['basil', true], ['pecorino', true]]),
  ...relations('109', [['chicken', false], ['pesto', true], ['mozzarella', false], ['tomato', true], ['zucchini', true]]),
  ...relations('110', [['sausage', false], ['potato', true], ['mozzarella', false], ['rosemary', true]]),
  ...relations('111', [['tomato', false], ['garlic', true], ['oregano', true]]),
  ...relations('112', [['zucchini', true], ['bell-pepper', true], ['tomato', true], ['basil', true], ['burrata', false]]),
  ...relations('113', [['guanciale', false], ['pecorino', true], ['mozzarella', false], ['egg', true]]),
  ...relations('114', [['tuna', false], ['red-onion', true], ['capers', true], ['tomato', false], ['mozzarella', false]]),
];

export const MODIFIERS: Modifier[] = [
  { id: 'standard-cheese', name: 'Обычный сыр', priceDeltaMinor: 0, available: true },
  { id: 'extra-cheese', name: 'Дополнительный сыр', priceDeltaMinor: 14000, available: true },
  { id: 'vegan-cheese', name: 'Растительный сыр', priceDeltaMinor: 16000, available: true },
  { id: 'extra-mushrooms', name: 'Больше грибов', priceDeltaMinor: 12000, available: true },
  { id: 'extra-jalapeno', name: 'Халапеньо', priceDeltaMinor: 8000, available: true },
  { id: 'extra-prosciutto', name: 'Прошутто', priceDeltaMinor: 18000, available: true },
  { id: 'extra-burrata', name: 'Буррата', priceDeltaMinor: 22000, available: false, unavailableReason: 'Буррата для добавок закончилась.' },
];

export const MODIFIER_GROUPS: ModifierGroup[] = [
  {
    id: 'cheese-style',
    name: 'Сыр',
    min: 1,
    max: 1,
    required: true,
    modifierIds: ['standard-cheese', 'extra-cheese', 'vegan-cheese'],
  },
  {
    id: 'extras',
    name: 'Добавки',
    min: 0,
    max: 2,
    required: false,
    modifierIds: ['extra-mushrooms', 'extra-jalapeno', 'extra-prosciutto', 'extra-burrata'],
  },
];

export const getProductIngredients = (productId: string): ProductIngredient[] =>
  PRODUCT_INGREDIENTS.filter((relation) => relation.productId === productId);

export const getIngredientsForRelations = (
  productIngredients: readonly ProductIngredient[],
): Ingredient[] => {
  const ids = new Set(productIngredients.map((relation) => relation.ingredientId));
  return INGREDIENTS.filter((ingredient) => ids.has(ingredient.id));
};

export const getModifierGroups = (groupIds: readonly string[]): ModifierGroup[] => {
  const ids = new Set(groupIds);
  return MODIFIER_GROUPS.filter((group) => ids.has(group.id));
};

export const getModifiersForGroups = (
  groups: readonly ModifierGroup[],
): Modifier[] => {
  const ids = new Set(groups.flatMap((group) => group.modifierIds));
  return MODIFIERS.filter((modifier) => ids.has(modifier.id));
};
export const buildProductDetails = (product: CatalogProduct, locale: Locale = 'ru'): ProductDetails => {
  const productIngredients = getProductIngredients(product.id);
  const modifierGroups = getModifierGroups(product.modifierGroupIds);

  return {
    product,
    variants: localizeVariants(getProductVariants(product.id), locale),
    ingredients: localizeIngredients(getIngredientsForRelations(productIngredients), locale),
    productIngredients,
    modifierGroups: localizeModifierGroups(modifierGroups, locale),
    modifiers: localizeModifiers(getModifiersForGroups(modifierGroups), locale),
  };
};
