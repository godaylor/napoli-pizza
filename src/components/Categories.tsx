import { useCatalogQuery } from '../features/catalog/model/useCatalogQuery';
import { useLocale } from '../shared/i18n/useLocale';

const categoryIds = [null, 'pizza', 'combo', 'snacks', 'drinks', 'desserts', 'sauces'] as const;

function Categories() {
  const { query, updateQuery } = useCatalogQuery();
  const { t } = useLocale();
  const labels = {
    all: t('Все', 'All'), pizza: t('Пицца', 'Pizza'), combo: t('Комбо', 'Combos'),
    snacks: t('Закуски', 'Sides'), drinks: t('Напитки', 'Drinks'),
    desserts: t('Десерты', 'Desserts'), sauces: t('Соусы', 'Sauces'),
  };

  return (
    <nav className="categories" aria-label={t('Категории меню', 'Menu categories')}>
      <ul>
        {categoryIds.map((categoryId) => (
          <li key={categoryId ?? 'all'}>
            <button
              type="button"
              aria-pressed={query.category === categoryId}
              onClick={() => updateQuery({ category: categoryId })}>
              {labels[categoryId ?? 'all']}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default Categories;
