import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react';

import { useCatalogQuery } from '../../features/catalog/model/useCatalogQuery';
import { useLocale } from '../../shared/i18n/useLocale';
import styles from './Search.module.scss';

const SEARCH_DEBOUNCE_MS = 250;

const Search = () => {
  const { query, updateQuery } = useCatalogQuery();
  const { t } = useLocale();
  const [value, setValue] = useState(query.q);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setValue(query.q);
  }, [query.q]);

  useEffect(() => {
    if (value === query.q) {
      return undefined;
    }

    const timeout = window.setTimeout(() => {
      updateQuery({ q: value }, { replace: true });
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timeout);
  }, [query.q, updateQuery, value]);

  const onChangeInput = (event: ChangeEvent<HTMLInputElement>) => {
    setValue(event.target.value);
  };

  const onClickClear = () => {
    setValue('');
    updateQuery({ q: '' }, { replace: true });
    inputRef.current?.focus();
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    updateQuery({ q: value }, { replace: true });
  };

  return (
    <form className={styles.root} role="search" onSubmit={onSubmit}>
      <label className="visually-hidden" htmlFor="catalog-search">{t('Поиск по меню', 'Search menu')}</label>
      <svg className={styles.icon} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m16 16 4 4" /></svg>
      <input id="catalog-search" ref={inputRef} value={value} onChange={onChangeInput} className={styles.input} placeholder={t('Найти в меню', 'Search the menu')} type="search" name="q" enterKeyHint="search" autoComplete="off" />
      {value ? <button className={styles.clearButton} type="button" onClick={onClickClear} aria-label={t('Очистить поиск', 'Clear search')}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 7 10 10M17 7 7 17" /></svg></button> : null}
    </form>
  );
};

export default Search;
