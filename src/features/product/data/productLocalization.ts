import type { Locale } from '../../../shared/i18n/locale';
import type { Ingredient, Modifier, ModifierGroup, ProductVariant } from '../model/product.types';

const INGREDIENT_EN: Record<string, { name: string; removalLabel: string; aliases?: string[] }> = {
  tomato: { name: 'Tomatoes', removalLabel: 'tomatoes', aliases: ['pelati'] },
  mozzarella: { name: 'Mozzarella', removalLabel: 'mozzarella', aliases: ['cheese'] },
  parmesan: { name: 'Parmesan', removalLabel: 'parmesan', aliases: ['cheese'] },
  basil: { name: 'Basil', removalLabel: 'basil', aliases: ['herbs'] },
  oregano: { name: 'Oregano', removalLabel: 'oregano', aliases: ['spices'] },
  pepperoni: { name: 'Pepperoni', removalLabel: 'pepperoni', aliases: ['salami'] },
  'red-onion': { name: 'Red onion', removalLabel: 'red onion', aliases: ['onion'] },
  mortadella: { name: 'Mortadella', removalLabel: 'mortadella' },
  stracciatella: { name: 'Stracciatella', removalLabel: 'stracciatella', aliases: ['cheese'] },
  pistachio: { name: 'Pistachio', removalLabel: 'pistachio', aliases: ['nuts'] },
  mushrooms: { name: 'Mushrooms', removalLabel: 'mushrooms' },
  truffle: { name: 'Truffle cream', removalLabel: 'truffle cream', aliases: ['truffle'] },
  gorgonzola: { name: 'Gorgonzola', removalLabel: 'gorgonzola', aliases: ['cheese'] },
  salami: { name: 'Spicy salami', removalLabel: 'spicy salami' },
  nduja: { name: 'Nduja', removalLabel: 'nduja' },
  jalapeno: { name: 'Jalapeño', removalLabel: 'jalapeño', aliases: ['pepper'] },
  prosciutto: { name: 'Prosciutto', removalLabel: 'prosciutto', aliases: ['ham'] },
  arugula: { name: 'Arugula', removalLabel: 'arugula', aliases: ['greens'] },
  eggplant: { name: 'Eggplant', removalLabel: 'eggplant' },
  ricotta: { name: 'Ricotta', removalLabel: 'ricotta', aliases: ['cheese'] },
  pecorino: { name: 'Pecorino', removalLabel: 'pecorino', aliases: ['cheese'] },
  chicken: { name: 'Chicken', removalLabel: 'chicken' },
  pesto: { name: 'Pesto', removalLabel: 'pesto', aliases: ['basil'] },
  zucchini: { name: 'Zucchini', removalLabel: 'zucchini' },
  sausage: { name: 'Salsiccia', removalLabel: 'salsiccia', aliases: ['sausage'] },
  potato: { name: 'Potato', removalLabel: 'potato' },
  rosemary: { name: 'Rosemary', removalLabel: 'rosemary' },
  garlic: { name: 'Garlic', removalLabel: 'garlic' },
  'bell-pepper': { name: 'Sweet pepper', removalLabel: 'sweet pepper' },
  burrata: { name: 'Burrata', removalLabel: 'burrata', aliases: ['cheese'] },
  guanciale: { name: 'Guanciale', removalLabel: 'guanciale', aliases: ['bacon'] },
  egg: { name: 'Egg yolk', removalLabel: 'egg yolk', aliases: ['egg'] },
  tuna: { name: 'Tuna', removalLabel: 'tuna', aliases: ['fish'] },
  capers: { name: 'Capers', removalLabel: 'capers' },
};

const MODIFIER_EN: Record<string, { name: string; unavailableReason?: string }> = {
  'standard-cheese': { name: 'Standard cheese' },
  'extra-cheese': { name: 'Extra cheese' },
  'vegan-cheese': { name: 'Plant-based cheese' },
  'extra-mushrooms': { name: 'Extra mushrooms' },
  'extra-jalapeno': { name: 'Jalapeño' },
  'extra-prosciutto': { name: 'Prosciutto' },
  'extra-burrata': { name: 'Burrata', unavailableReason: 'Burrata add-on is sold out.' },
};

const GROUP_EN: Record<string, string> = { 'cheese-style': 'Cheese', extras: 'Add-ons' };

export const localizeIngredients = (items: Ingredient[], locale: Locale): Ingredient[] =>
  locale === 'ru' ? items : items.map((item) => {
    const copy = INGREDIENT_EN[item.id];
    return copy ? { ...item, name: copy.name, removalLabel: copy.removalLabel, searchAliases: copy.aliases ?? [] } : item;
  });

export const localizeModifiers = (items: Modifier[], locale: Locale): Modifier[] =>
  locale === 'ru' ? items : items.map((item) => {
    const copy = MODIFIER_EN[item.id];
    return copy ? { ...item, name: copy.name, unavailableReason: copy.unavailableReason } : item;
  });

export const localizeModifierGroups = (items: ModifierGroup[], locale: Locale): ModifierGroup[] =>
  locale === 'ru' ? items : items.map((item) => ({ ...item, name: GROUP_EN[item.id] ?? item.name }));

export const localizeVariants = (items: ProductVariant[], locale: Locale): ProductVariant[] =>
  locale === 'ru' ? items : items.map((item) => ({
    ...item,
    unavailableReason: item.unavailableReason
      ? 'The 35 cm size is temporarily unavailable: the large dough base is sold out.'
      : undefined,
  }));

