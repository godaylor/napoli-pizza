import { useState } from 'react';

import type { ProductImage as ProductImageModel } from '../model/catalog.types';
import { useLocale } from '../../../shared/i18n/useLocale';

interface ProductImageProps {
  image: ProductImageModel;
  name: string;
  priority?: boolean;
}

const sourceSet = (key: string, extension: string) =>
  `/menu/${key}-480.${extension} 480w, /menu/${key}-960.${extension} 960w`;

export function ProductImage({ image, name, priority = false }: ProductImageProps) {
  const [failed, setFailed] = useState(false);
  const { t } = useLocale();

  if (failed) {
    return (
      <div
        className="product-image-fallback"
        role="img"
        aria-label={`${t('Изображение', 'Image')} “${name}” ${t('недоступно', 'is unavailable')}`}>
        <span aria-hidden="true">N</span>
        <small>{t('Фото скоро вернётся', 'Photo coming back soon')}</small>
      </div>
    );
  }

  return (
    <picture>
      <source
        type="image/avif"
        srcSet={sourceSet(image.key, 'avif')}
        sizes="(max-width: 639px) calc(100vw - 24px), (max-width: 1023px) 45vw, 300px"
      />
      <source
        type="image/webp"
        srcSet={sourceSet(image.key, 'webp')}
        sizes="(max-width: 639px) calc(100vw - 24px), (max-width: 1023px) 45vw, 300px"
      />
      <img
        data-product-image
        src={`/menu/${image.key}-960.jpg`}
        srcSet={sourceSet(image.key, 'jpg')}
        sizes="(max-width: 639px) calc(100vw - 24px), (max-width: 1023px) 45vw, 300px"
        alt={image.alt}
        width={image.width}
        height={image.height}
        loading={priority ? 'eager' : 'lazy'}
        {...{ fetchpriority: priority ? 'high' : 'auto' }}
        decoding="async"
        onError={() => setFailed(true)}
      />
    </picture>
  );
}
