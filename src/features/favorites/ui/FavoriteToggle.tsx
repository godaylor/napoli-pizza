import { useAppDispatch, useAppSelector } from '../../../redux/hooks';
import { selectIsFavorite } from '../model/favoritesSelectors';
import { toggleFavorite } from '../model/favoritesSlice';
import { useLocale } from '../../../shared/i18n/useLocale';

interface FavoriteToggleProps {
  productId: string;
  productName: string;
  className?: string;
}

export function FavoriteToggle({
  productId,
  productName,
  className,
}: FavoriteToggleProps) {
  const dispatch = useAppDispatch();
  const { t } = useLocale();
  const isFavorite = useAppSelector(selectIsFavorite(productId));
  const action = isFavorite ? t('Убрать из избранного', 'Remove from favorites') : t('Добавить в избранное', 'Add to favorites');

  return (
    <button
      className={`favorite-toggle${isFavorite ? ' favorite-toggle--active' : ''}${className ? ` ${className}` : ''}`}
      type="button"
      aria-pressed={isFavorite}
      aria-label={`${action}: ${productName}`}
      title={action}
      onClick={() => dispatch(toggleFavorite(productId))}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 20.4 4.5 13A5.1 5.1 0 0 1 12 6.1 5.1 5.1 0 0 1 19.5 13Z" />
      </svg>
    </button>
  );
}
