import type { Locale } from '../../../shared/i18n/locale';
import type {
  CatalogCategory,
  CatalogProduct,
  CatalogSnapshot,
  ProductBadge,
} from '../model/catalog.types';

const CATEGORY_EN: Record<string, Pick<CatalogCategory, 'label' | 'eyebrow' | 'description'>> = {
  pizza: { label: 'Pizza', eyebrow: 'Naples / Moscow', description: 'A thin center, airy crust, and oven heat after you order.' },
  combo: { label: 'Combos', eyebrow: 'Set menus', description: 'Fixed contents and a clear price, with no hidden substitutions.' },
  snacks: { label: 'Sides', eyebrow: 'For the table', description: 'Small hot dishes made for sharing.' },
  drinks: { label: 'Drinks', eyebrow: 'Cold station', description: 'Lemonades, water, and cola without excessive sweetness.' },
  desserts: { label: 'Desserts', eyebrow: 'Dolci', description: 'Italian classics in small, honest portions.' },
  sauces: { label: 'Sauces', eyebrow: 'For the crusts', description: 'Made in our kitchen and served separately.' },
};

interface ProductEnglishCopy {
  name: string;
  description: string;
  alt: string;
  aliases?: string[];
  availability?: string;
}

const PRODUCT_EN: Record<string, ProductEnglishCopy> = {
  '101': { name: 'Margherita Napoli', description: 'Pelati tomatoes, fior di latte, parmesan, and fresh basil.', alt: 'Margherita pizza with tomatoes, cheese, and basil' },
  '102': { name: 'Pepperoni Napoli', description: 'Spicy pepperoni, mozzarella, tomato sauce, red onion, and oregano.', alt: 'Pepperoni pizza with mozzarella, red onion, and oregano', aliases: ['sausage', 'salami'] },
  '103': { name: 'Mortadella & pistachio', description: 'Mortadella, stracciatella, pistachio, and lemon zest.', alt: 'White pizza with mortadella, stracciatella, and pistachio' },
  '104': { name: 'Funghi tartufo', description: 'Mushrooms, mozzarella, thyme, and truffle cream.', alt: 'White pizza with mushrooms and thyme', aliases: ['mushroom', 'truffle'] },
  '105': { name: 'Quattro formaggi', description: 'Mozzarella, gorgonzola, taleggio, and parmesan on a cream base.', alt: 'White pizza with four Italian cheeses', aliases: ['cheese'] },
  '106': { name: 'Diavola', description: 'Spicy salami, nduja, tomatoes, mozzarella, and jalapeño.', alt: 'Spicy pizza with salami, nduja, and jalapeño' },
  '107': { name: 'Prosciutto & arugula', description: 'Prosciutto crudo, arugula, tomatoes, mozzarella, and parmesan.', alt: 'Pizza with prosciutto, arugula, and parmesan' },
  '108': { name: 'Melanzana', description: 'Roasted eggplant, tomatoes, ricotta, basil, and pecorino.', alt: 'Vegetable pizza with eggplant, ricotta, and basil' },
  '109': { name: 'Pollo pesto', description: 'Oven-roasted chicken, pesto, mozzarella, sun-dried tomatoes, and zucchini.', alt: 'Pizza with chicken, pesto, tomatoes, and zucchini' },
  '110': { name: 'Salsiccia', description: 'Italian sausage, potato, rosemary, and smoked mozzarella.', alt: 'Pizza with Italian sausage, potato, and rosemary' },
  '111': { name: 'Marinara', description: 'Tomatoes, garlic, oregano, and olive oil. No cheese.', alt: 'Marinara pizza with tomatoes, garlic, and oregano' },
  '112': { name: 'Verdure & burrata', description: 'Zucchini, sweet pepper, cherry tomatoes, basil, and burrata.', alt: 'Vegetable pizza with zucchini, peppers, tomatoes, and burrata' },
  '113': { name: 'Carbonara', description: 'Guanciale, pecorino, mozzarella, egg yolk, and black pepper.', alt: 'White Carbonara pizza with guanciale and pecorino' },
  '114': { name: 'Tonno & cipolla', description: 'Tuna, red onion, capers, tomatoes, and mozzarella.', alt: 'Pizza with tuna, red onion, and capers', availability: 'Tuna returns tomorrow after 12:00.' },
  '201': { name: 'Evening for two', description: '30 cm Margherita, 30 cm Pepperoni, and 1 L craft cola.', alt: 'Margherita, Pepperoni, and a bottle of craft cola', availability: 'Fixed contents, no substitutions.' },
  '202': { name: 'Movie night', description: '30 cm Pepperoni, rosemary potatoes, and 1 L cola.', alt: 'Combo with pizza, potatoes, and a cold drink', availability: 'Fixed contents, no substitutions.' },
  '203': { name: 'Family oven', description: 'Three 30 cm pizzas, two sides, and four 0.33 L drinks.', alt: 'Large family combo with pizzas, sides, and drinks', availability: 'Fixed contents, no substitutions.' },
  '204': { name: 'Napoli lunch', description: '25 cm Margherita, tomato salad, and 0.5 L water.', alt: 'Lunch combo with a small pizza, salad, and water', availability: 'Available weekdays from 12:00 to 16:00.' },
  '301': { name: 'Rosemary potatoes', description: 'Roasted with garlic, sea salt, and rosemary.', alt: 'Crispy potato wedges with rosemary' },
  '302': { name: 'Mozzarella sticks', description: 'Crispy coating, stretchy mozzarella, and tomato dip.', alt: 'Baked mozzarella sticks with tomato sauce' },
  '303': { name: 'Chicken polpette', description: 'Oven-baked chicken bites, parmesan, and arrabbiata sauce.', alt: 'Oven-baked chicken polpette with tomato sauce' },
  '304': { name: 'Tomatoes & burrata', description: 'Sweet tomatoes, burrata, basil, and olive oil.', alt: 'Tomato and burrata salad with fresh basil' },
  '305': { name: 'Garlic focaccia', description: 'Airy dough, garlic oil, parmesan, and parsley.', alt: 'Golden focaccia with garlic, parmesan, and herbs', availability: 'A fresh batch of dough will be ready in 40 minutes.' },
  '401': { name: 'Basil lemonade', description: 'Lemon, basil, cane sugar, and sparkling water, 0.4 L.', alt: 'Cold lemonade with lemon, basil, and ice', aliases: ['basil drink'], availability: 'Made just before pickup.' },
  '402': { name: 'Blood orange', description: 'Orange, grapefruit, and soda, 0.4 L.', alt: 'Citrus lemonade with blood orange and ice', availability: 'Made just before pickup.' },
  '403': { name: 'Craft cola', description: 'Spiced cola with a clean finish, 0.33 L.', alt: 'Chilled dark cola in a glass bottle' },
  '404': { name: 'Sparkling water', description: 'Medium-carbonation mineral water, 0.5 L.', alt: 'Chilled sparkling water in a clear bottle' },
  '405': { name: 'Still water', description: 'Pure mineral water, 0.5 L.', alt: 'Chilled still water in a clear bottle' },
  '501': { name: 'Tiramisu', description: 'Savoiardi, mascarpone, espresso, and cocoa.', alt: 'A serving of tiramisu dusted with cocoa' },
  '502': { name: 'Mini cannoli', description: 'Two crisp shells with ricotta and pistachio.', alt: 'Two mini cannoli with ricotta cream' },
  '503': { name: 'Chocolate budino', description: 'Dark chocolate, cream, and sea salt flakes.', alt: 'Chocolate budino pudding in a small cup' },
  '504': { name: 'Lemon panna cotta', description: 'Creamy panna cotta, lemon curd, and raspberry.', alt: 'Lemon panna cotta with raspberries', availability: 'Returns to the menu tomorrow.' },
  '601': { name: 'Tomato', description: 'Pelati tomatoes, garlic, oregano, and olive oil, 50 g.', alt: 'Tomato sauce in a small ceramic bowl' },
  '602': { name: 'Parmesan', description: 'Cream, parmesan, and black pepper, 50 g.', alt: 'Creamy parmesan sauce in a small bowl' },
  '603': { name: 'Pesto', description: 'Basil, parmesan, pine nuts, and olive oil, 50 g.', alt: 'Green basil pesto sauce' },
  '604': { name: 'Arrabbiata', description: 'Tomatoes, chili, garlic, and parsley, 50 g.', alt: 'Spicy arrabbiata tomato sauce' },
};

const ALLERGEN_EN: Record<string, string> = {
  'глютен': 'gluten', 'молоко': 'milk', 'орехи': 'nuts', 'яйцо': 'egg', 'рыба': 'fish',
};

export const BADGE_LABELS_BY_LOCALE: Record<Locale, Record<ProductBadge, string>> = {
  ru: { popular: 'Хит', new: 'Новинка', vegetarian: 'Без мяса', spicy: 'Острое' },
  en: { popular: 'Popular', new: 'New', vegetarian: 'Vegetarian', spicy: 'Spicy' },
};

export const localizeCatalogProduct = (product: CatalogProduct, locale: Locale): CatalogProduct => {
  if (locale === 'ru') return product;
  const copy = PRODUCT_EN[product.id];
  if (!copy) return product;
  return {
    ...product,
    name: copy.name,
    description: copy.description,
    searchAliases: copy.aliases ?? [],
    allergens: product.allergens.map((allergen) => ALLERGEN_EN[allergen] ?? allergen),
    availability: {
      ...product.availability,
      note: copy.availability ?? (product.availability.status === 'available' ? 'Made after you order.' : product.availability.note),
    },
    image: { ...product.image, alt: copy.alt },
  };
};

export const localizeCatalogSnapshot = (snapshot: CatalogSnapshot, locale: Locale): CatalogSnapshot => {
  if (locale === 'ru') return snapshot;
  return {
    ...snapshot,
    categories: snapshot.categories.map((category) => ({ ...category, ...CATEGORY_EN[category.id] })),
    products: snapshot.products.map((product) => localizeCatalogProduct(product, locale)),
  };
};
