import { menuImageAlt } from './menuImageAlt';
import {
  CATALOG_VERSION,
  type CatalogCategory,
  type CatalogProduct,
  type CatalogSnapshot,
  type ProductBadge,
  type ProductKind,
} from '../model/catalog.types';

export const CATALOG_CATEGORIES: CatalogCategory[] = [
  {
    id: 'pizza',
    label: 'Пицца',
    eyebrow: 'Неаполь / Москва',
    description: 'Тонкий центр, воздушный борт и жар печи после вашего заказа.',
  },
  {
    id: 'combo',
    label: 'Комбо',
    eyebrow: 'Готовые наборы',
    description: 'Фиксированный состав и понятная цена — без скрытых замен.',
  },
  {
    id: 'snacks',
    label: 'Закуски',
    eyebrow: 'К столу',
    description: 'Горячие небольшие блюда, которые удобно делить.',
  },
  {
    id: 'drinks',
    label: 'Напитки',
    eyebrow: 'Холодный цех',
    description: 'Лимонады, вода и кола без лишней сладости.',
  },
  {
    id: 'desserts',
    label: 'Десерты',
    eyebrow: 'Dolci',
    description: 'Итальянская классика небольшими честными порциями.',
  },
  {
    id: 'sauces',
    label: 'Соусы',
    eyebrow: 'К бортикам',
    description: 'Соусы готовим на нашей кухне и подаём отдельно.',
  },
];

const image = (key: string, alt: string) => ({
  key,
  alt: menuImageAlt(key, 'ru') ?? alt,
  width: 960 as const,
  height: 960 as const,
});

const available = (note = 'Готовим после заказа') => ({
  status: 'available' as const,
  note,
});

const soldOut = (note: string) => ({
  status: 'sold-out' as const,
  note,
});

const SEARCH_ALIASES: Partial<Record<number, string[]>> = {
  102: ['колбаски', 'салями'],
  104: ['грибная', 'трюфель'],
  105: ['сырная'],
  401: ['напиток с базиликом'],
};

const PIZZA_VARIANT_KEYS = [
  '25-thin',
  '25-traditional',
  '30-thin',
  '30-traditional',
  '35-traditional',
] as const;

const product = (
  value: Omit<
    CatalogProduct,
    | 'id'
    | 'searchAliases'
    | 'variantIds'
    | 'modifierGroupIds'
    | 'nutrition'
  > & { id: number },
): CatalogProduct => {
  const id = String(value.id);
  const isPizza = value.kind === 'pizza';

  return {
    ...value,
    id,
    searchAliases: SEARCH_ALIASES[value.id] ?? [],
    variantIds: isPizza
      ? PIZZA_VARIANT_KEYS.map((key) => `${id}-${key}`)
      : [`${id}-base`],
    modifierGroupIds: isPizza ? ['cheese-style', 'extras'] : [],
    nutrition: isPizza
      ? {
          servingGrams: 100,
          caloriesKcal: 246,
          proteinGrams: 11,
          fatGrams: 9,
          carbohydrateGrams: 30,
        }
      : undefined,
  };
};

export const CATALOG_PRODUCTS: CatalogProduct[] = [
  product({ id: 101, slug: 'margherita-napoli', kind: 'pizza', categoryId: 'pizza', name: 'Маргарита Napoli', description: 'Томаты пелати, fior di latte, пармезан и свежий базилик.', priceFromMinor: 59000, popularity: 98, badges: ['popular', 'vegetarian'], allergens: ['глютен', 'молоко'], availability: available(), image: image('pizza-margherita', 'Пицца Маргарита с томатами, сыром и базиликом') }),
  product({ id: 102, slug: 'pepperoni-napoli', kind: 'pizza', categoryId: 'pizza', name: 'Пепперони Napoli', description: 'Пряная пепперони, моцарелла, томатный соус, красный лук и орегано.', priceFromMinor: 79000, popularity: 100, badges: ['popular', 'spicy'], allergens: ['глютен', 'молоко'], availability: available(), image: image('pizza-pepperoni', 'Пицца с пепперони, моцареллой и перцем чили') }),
  product({ id: 103, slug: 'mortadella-pistachio', kind: 'pizza', categoryId: 'pizza', name: 'Мортаделла и фисташка', description: 'Мортаделла, страчателла, фисташка и лимонная цедра.', priceFromMinor: 92000, popularity: 91, badges: ['new'], allergens: ['глютен', 'молоко', 'орехи'], availability: available(), image: image('pizza-margherita', 'Светлая пицца с мортаделлой, страчателлой и фисташкой') }),
  product({ id: 104, slug: 'funghi-tartufo', kind: 'pizza', categoryId: 'pizza', name: 'Фунги тартуфо', description: 'Шампиньоны, вешенки, моцарелла, тимьян и трюфельный крем.', priceFromMinor: 84000, popularity: 90, badges: ['vegetarian'], allergens: ['глютен', 'молоко'], availability: available(), image: image('pizza-funghi', 'Белая пицца с грибами и тимьяном') }),
  product({ id: 105, slug: 'quattro-formaggi', kind: 'pizza', categoryId: 'pizza', name: 'Четыре сыра', description: 'Моцарелла, горгонзола, таледжио и пармезан на сливочной основе.', priceFromMinor: 89000, popularity: 94, badges: ['popular', 'vegetarian'], allergens: ['глютен', 'молоко'], availability: available(), image: image('pizza-funghi', 'Светлая пицца с четырьмя итальянскими сырами') }),
  product({ id: 106, slug: 'diavola', kind: 'pizza', categoryId: 'pizza', name: 'Дьявола', description: 'Острая салями, nduja, томаты, моцарелла и халапеньо.', priceFromMinor: 85000, popularity: 89, badges: ['spicy'], allergens: ['глютен', 'молоко'], availability: available(), image: image('pizza-pepperoni', 'Острая пицца с салями, nduja и халапеньо') }),
  product({ id: 107, slug: 'prosciutto-rucola', kind: 'pizza', categoryId: 'pizza', name: 'Прошутто и руккола', description: 'Прошутто крудо, руккола, томаты, моцарелла и пармезан.', priceFromMinor: 99000, popularity: 88, badges: [], allergens: ['глютен', 'молоко'], availability: available(), image: image('pizza-margherita', 'Пицца с прошутто, рукколой и пармезаном') }),
  product({ id: 108, slug: 'melanzana', kind: 'pizza', categoryId: 'pizza', name: 'Меланзана', description: 'Печёный баклажан, томаты, рикотта, базилик и пекорино.', priceFromMinor: 78000, popularity: 83, badges: ['vegetarian'], allergens: ['глютен', 'молоко'], availability: available(), image: image('pizza-verdure', 'Овощная пицца с баклажаном, рикоттой и базиликом') }),
  product({ id: 109, slug: 'pollo-pesto', kind: 'pizza', categoryId: 'pizza', name: 'Полло песто', description: 'Курица из печи, песто, моцарелла, вяленые томаты и цукини.', priceFromMinor: 89000, popularity: 87, badges: [], allergens: ['глютен', 'молоко', 'орехи'], availability: available(), image: image('pizza-verdure', 'Пицца с курицей, песто, томатами и цукини') }),
  product({ id: 110, slug: 'salsiccia', kind: 'pizza', categoryId: 'pizza', name: 'Сальсичча', description: 'Итальянская колбаска, картофель, розмарин и копчёная моцарелла.', priceFromMinor: 93000, popularity: 86, badges: ['new'], allergens: ['глютен', 'молоко'], availability: available(), image: image('pizza-pepperoni', 'Пицца с итальянской колбаской, картофелем и розмарином') }),
  product({ id: 111, slug: 'marinara', kind: 'pizza', categoryId: 'pizza', name: 'Маринара', description: 'Томаты, чеснок, орегано и оливковое масло. Без сыра.', priceFromMinor: 49000, popularity: 82, badges: ['vegetarian'], allergens: ['глютен'], availability: available(), image: image('pizza-margherita', 'Пицца Маринара с томатами, чесноком и орегано') }),
  product({ id: 112, slug: 'verdure-burrata', kind: 'pizza', categoryId: 'pizza', name: 'Вердуре и буррата', description: 'Цукини, сладкий перец, черри, базилик и буррата.', priceFromMinor: 95000, popularity: 92, badges: ['new', 'vegetarian'], allergens: ['глютен', 'молоко'], availability: available(), image: image('pizza-verdure', 'Овощная пицца с цукини, перцем, томатами и бурратой') }),
  product({ id: 113, slug: 'carbonara', kind: 'pizza', categoryId: 'pizza', name: 'Карбонара', description: 'Гуанчале, пекорино, моцарелла, желток и чёрный перец.', priceFromMinor: 91000, popularity: 93, badges: ['popular'], allergens: ['глютен', 'молоко', 'яйцо'], availability: available(), image: image('pizza-funghi', 'Светлая пицца Карбонара с гуанчале и пекорино') }),
  product({ id: 114, slug: 'tonno-cipolla', kind: 'pizza', categoryId: 'pizza', name: 'Тонно и чиполла', description: 'Тунец, красный лук, каперсы, томаты и моцарелла.', priceFromMinor: 89000, popularity: 78, badges: [], allergens: ['глютен', 'молоко', 'рыба'], availability: soldOut('Тунец вернётся завтра после 12:00'), image: image('pizza-margherita', 'Пицца с тунцом, красным луком и каперсами') }),

  product({ id: 201, slug: 'evening-for-two', kind: 'combo', categoryId: 'combo', name: 'Вечер на двоих', description: 'Маргарита 30 см, Пепперони 30 см и крафтовая кола 1 л.', priceFromMinor: 199000, popularity: 97, badges: ['popular'], allergens: ['глютен', 'молоко'], availability: available('Фиксированный состав, без замен'), image: image('combo', 'Комбо из двух пицц, напитков и горячей закуски') }),
  product({ id: 202, slug: 'movie-night', kind: 'combo', categoryId: 'combo', name: 'Кино и пицца', description: 'Пепперони 30 см, картофель с розмарином и кола 1 л.', priceFromMinor: 159000, popularity: 90, badges: [], allergens: ['глютен', 'молоко'], availability: available('Фиксированный состав, без замен'), image: image('combo', 'Комбо с пиццей, картофелем и холодным напитком') }),
  product({ id: 203, slug: 'family-oven', kind: 'combo', categoryId: 'combo', name: 'Семейная печь', description: 'Три пиццы 30 см, две закуски и четыре напитка 0,33 л.', priceFromMinor: 289000, popularity: 88, badges: ['new'], allergens: ['глютен', 'молоко', 'яйцо'], availability: available('Фиксированный состав, без замен'), image: image('combo', 'Большое семейное комбо с пиццами, закусками и напитками') }),
  product({ id: 204, slug: 'napoli-lunch', kind: 'combo', categoryId: 'combo', name: 'Обед Napoli', description: 'Маргарита 25 см, салат с томатами и вода 0,5 л.', priceFromMinor: 99000, popularity: 84, badges: [], allergens: ['глютен', 'молоко'], availability: soldOut('Доступно по будням с 12:00 до 16:00'), image: image('combo', 'Обеденное комбо с небольшой пиццей, салатом и водой') }),

  product({ id: 301, slug: 'rosemary-potatoes', kind: 'snacks', categoryId: 'snacks', name: 'Картофель с розмарином', description: 'Запекаем с чесноком, морской солью и розмарином.', priceFromMinor: 32000, popularity: 86, badges: ['vegetarian'], allergens: [], availability: available(), image: image('snacks', 'Хрустящие картофельные дольки с розмарином') }),
  product({ id: 302, slug: 'mozzarella-sticks', kind: 'snacks', categoryId: 'snacks', name: 'Палочки моцареллы', description: 'Хрустящая панировка, тягучая моцарелла и томатный дип.', priceFromMinor: 42000, popularity: 89, badges: ['popular', 'vegetarian'], allergens: ['глютен', 'молоко', 'яйцо'], availability: available(), image: image('snacks', 'Запечённые палочки моцареллы с томатным соусом') }),
  product({ id: 303, slug: 'chicken-polpette', kind: 'snacks', categoryId: 'snacks', name: 'Куриные польпетте', description: 'Куриные шарики из печи, пармезан и соус arrabbiata.', priceFromMinor: 46000, popularity: 82, badges: ['spicy'], allergens: ['молоко', 'яйцо'], availability: available(), image: image('snacks', 'Куриные польпетте из печи с томатным соусом') }),
  product({ id: 304, slug: 'tomato-burrata-salad', kind: 'snacks', categoryId: 'snacks', name: 'Томаты и буррата', description: 'Сладкие томаты, буррата, базилик и оливковое масло.', priceFromMinor: 59000, popularity: 85, badges: ['vegetarian'], allergens: ['молоко'], availability: available(), image: image('pizza-verdure', 'Салат из томатов, бурраты и свежего базилика') }),
  product({ id: 305, slug: 'focaccia-garlic', kind: 'snacks', categoryId: 'snacks', name: 'Фокачча с чесноком', description: 'Воздушное тесто, чесночное масло, пармезан и петрушка.', priceFromMinor: 29000, popularity: 80, badges: ['vegetarian'], allergens: ['глютен', 'молоко'], availability: soldOut('Новая партия теста будет через 40 минут'), image: image('pizza-margherita', 'Румяная фокачча с чесноком, пармезаном и зеленью') }),

  product({ id: 401, slug: 'basil-lemonade', kind: 'drinks', categoryId: 'drinks', name: 'Базиликовый лимонад', description: 'Лимон, базилик, тростниковый сахар и газированная вода, 0,4 л.', priceFromMinor: 29000, popularity: 90, badges: ['popular'], allergens: [], availability: available('Готовим перед выдачей'), image: image('drinks', 'Холодный лимонад с лимоном, базиликом и льдом') }),
  product({ id: 402, slug: 'blood-orange-lemonade', kind: 'drinks', categoryId: 'drinks', name: 'Красный апельсин', description: 'Апельсин, грейпфрут и содовая, 0,4 л.', priceFromMinor: 29000, popularity: 87, badges: ['new'], allergens: [], availability: available('Готовим перед выдачей'), image: image('drinks', 'Цитрусовый лимонад с красным апельсином и льдом') }),
  product({ id: 403, slug: 'craft-cola', kind: 'drinks', categoryId: 'drinks', name: 'Крафтовая кола', description: 'Кола с пряностями без искусственного послевкусия, 0,33 л.', priceFromMinor: 25000, popularity: 88, badges: [], allergens: [], availability: available(), image: image('drinks', 'Охлаждённая тёмная кола в стеклянной бутылке') }),
  product({ id: 404, slug: 'sparkling-water', kind: 'drinks', categoryId: 'drinks', name: 'Вода с газом', description: 'Минеральная вода средней газации, 0,5 л.', priceFromMinor: 19000, popularity: 72, badges: [], allergens: [], availability: available(), image: image('drinks', 'Охлаждённая газированная вода в прозрачной бутылке') }),
  product({ id: 405, slug: 'still-water', kind: 'drinks', categoryId: 'drinks', name: 'Вода без газа', description: 'Чистая минеральная вода, 0,5 л.', priceFromMinor: 19000, popularity: 70, badges: [], allergens: [], availability: available(), image: image('drinks', 'Охлаждённая негазированная вода в прозрачной бутылке') }),

  product({ id: 501, slug: 'tiramisu', kind: 'desserts', categoryId: 'desserts', name: 'Тирамису', description: 'Савоярди, маскарпоне, эспрессо и какао.', priceFromMinor: 39000, popularity: 96, badges: ['popular'], allergens: ['глютен', 'молоко', 'яйцо'], availability: available(), image: image('desserts', 'Порция тирамису с какао') }),
  product({ id: 502, slug: 'mini-cannoli', kind: 'desserts', categoryId: 'desserts', name: 'Мини-канноли', description: 'Две хрустящие трубочки с рикоттой и фисташкой.', priceFromMinor: 42000, popularity: 86, badges: [], allergens: ['глютен', 'молоко', 'орехи'], availability: available(), image: image('desserts', 'Два мини-канноли с кремом из рикотты') }),
  product({ id: 503, slug: 'chocolate-budino', kind: 'desserts', categoryId: 'desserts', name: 'Шоколадный будино', description: 'Тёмный шоколад, сливки и хлопья морской соли.', priceFromMinor: 41000, popularity: 85, badges: ['new'], allergens: ['молоко'], availability: available(), image: image('desserts', 'Шоколадный пудинг будино в небольшой чаше') }),
  product({ id: 504, slug: 'lemon-panna-cotta', kind: 'desserts', categoryId: 'desserts', name: 'Лимонная панна-котта', description: 'Сливочная панна-котта, лимонный крем и малина.', priceFromMinor: 39000, popularity: 81, badges: [], allergens: ['молоко'], availability: soldOut('Вернётся в меню завтра'), image: image('desserts', 'Лимонная панна-котта с малиной') }),

  product({ id: 601, slug: 'tomato-sauce', kind: 'sauces', categoryId: 'sauces', name: 'Томатный', description: 'Пелати, чеснок, орегано и оливковое масло, 50 г.', priceFromMinor: 9000, popularity: 84, badges: ['vegetarian'], allergens: [], availability: available(), image: image('snacks', 'Томатный соус в небольшой керамической чаше') }),
  product({ id: 602, slug: 'parmesan-sauce', kind: 'sauces', categoryId: 'sauces', name: 'Пармезановый', description: 'Сливки, пармезан и чёрный перец, 50 г.', priceFromMinor: 11000, popularity: 89, badges: ['popular', 'vegetarian'], allergens: ['молоко'], availability: available(), image: image('snacks', 'Сливочный пармезановый соус в небольшой чаше') }),
  product({ id: 603, slug: 'pesto-sauce', kind: 'sauces', categoryId: 'sauces', name: 'Песто', description: 'Базилик, пармезан, кедровый орех и оливковое масло, 50 г.', priceFromMinor: 12000, popularity: 82, badges: ['vegetarian'], allergens: ['молоко', 'орехи'], availability: available(), image: image('pizza-verdure', 'Зелёный соус песто с базиликом') }),
  product({ id: 604, slug: 'arrabbiata-sauce', kind: 'sauces', categoryId: 'sauces', name: 'Арраббьята', description: 'Томаты, чили, чеснок и петрушка, 50 г.', priceFromMinor: 10000, popularity: 80, badges: ['spicy', 'vegetarian'], allergens: [], availability: available(), image: image('snacks', 'Острый томатный соус арраббьята') }),
];

export const OWNED_CATALOG: CatalogSnapshot = {
  version: CATALOG_VERSION,
  updatedAt: '2026-08-28T00:00:00.000Z',
  categories: CATALOG_CATEGORIES,
  products: CATALOG_PRODUCTS,
};

export const BADGE_LABELS: Record<ProductBadge, string> = {
  popular: 'Хит',
  new: 'Новинка',
  vegetarian: 'Без мяса',
  spicy: 'Острое',
};

export const CATEGORY_LABELS: Record<ProductKind, string> = Object.fromEntries(
  CATALOG_CATEGORIES.map((category) => [category.id, category.label]),
) as Record<ProductKind, string>;
