import { useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import {
  parseCatalogQuery,
  serializeCatalogQuery,
} from '../../../lib/catalogQuery';
import type { CatalogQuery } from './catalog.types';

interface UpdateCatalogQueryOptions {
  replace?: boolean;
}

type CatalogQueryPatch = Partial<CatalogQuery>;

export const useCatalogQuery = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const query = useMemo(() => parseCatalogQuery(location.search), [location.search]);

  const updateQuery = useCallback(
    (patch: CatalogQueryPatch, options: UpdateCatalogQueryOptions = {}) => {
      const search = serializeCatalogQuery({ ...query, ...patch });
      navigate(
        {
          pathname: '/menu',
          search: search ? `?${search}` : '',
        },
        { replace: options.replace ?? false },
      );
    },
    [navigate, query],
  );

  return { query, updateQuery };
};
