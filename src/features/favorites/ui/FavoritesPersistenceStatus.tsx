import { useAppSelector } from '../../../redux/hooks';
import { selectFavoritesPersistenceWarning } from '../model/favoritesSelectors';
import { useLocale } from '../../../shared/i18n/useLocale';

export function FavoritesPersistenceStatus() {
  const warning = useAppSelector(selectFavoritesPersistenceWarning);
  const { t } = useLocale();
  if (!warning) return null;
  return (
    <p className="visually-hidden" role="status" aria-live="polite" aria-atomic="true">
      {t(warning, 'Favorites storage is unavailable. Your latest change was rolled back.')}
    </p>
  );
}

