import React from 'react';
import qs from 'qs';
import axios from 'axios';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setFilters } from '../redux/slices/filterSlice';

import Categories from '../components/Categories';
import Sort, { list } from '../components/Sort';
import PizzaBlock from '../components/PizzaBlock';
import PizzaSkeleton from '../components/PizzaBlock/PizzaSkeleton';
import Pagination from '../components/Pagination';

import { SearchContext } from '../App';

const Home = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isSearch = React.useRef(false);
  const isMounted = React.useRef(false);

  const { activeCategory, sort, currentPage } = useSelector((state) => state.filter);

  const { searchValue } = React.useContext(SearchContext);
  const [items, setItems] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    if (window.location.search) {
      const params = qs.parse(window.location.search.substring(1));
      const sort = list.find((obj) => obj.sortProperty === params.sortProperty);
      dispatch(
        setFilters({
          ...params,
          sort,
        }),
      );
      isSearch.current = true;
    }
  }, []);

  React.useEffect(() => {
    if (isMounted.current) {
      const queryString = qs.stringify({
        sortProperty: sort.sortProperty,
        activeCategory,
        // searchValue,
        currentPage,
      });
      console.log(queryString);
      queryString === 'sortProperty=-rating&activeCategory=0&currentPage=1'
        ? navigate('')
        : navigate(`?${queryString}`);
    }
    isMounted.current = true;
  }, [activeCategory, sort.sortProperty, currentPage]);

  const fetchPizzas = () => {
    setIsLoading(true);
    const order = sort.sortProperty.charAt(0) === '-' ? 'desc' : 'asc';
    const sortBy = sort.sortProperty.replace('-', '');
    const category = activeCategory > 0 ? `&category=${activeCategory}` : '';
    const sortAndOrder = `&sortBy=${sortBy}&order=${order}`;
    const search = searchValue ? `&search=${searchValue}` : '';

    axios
      .get(
        `https://643ee654c72fda4a0b0430f8.mockapi.io/items?page=${currentPage}&limit=4${category}${sortAndOrder}${search}`,
      )
      .then((response) => {
        setItems(response.data);
        setIsLoading(false);
      });
  };

  React.useEffect(() => {
    window.scrollTo(0, 0);
    if (!isSearch.current) {
      fetchPizzas();
    }
    isSearch.current = false;
  }, [activeCategory, sort.sortProperty, searchValue, currentPage]);

  const pizzas = items.map((pizza) => <PizzaBlock key={pizza.id} {...pizza} />);
  const skeletons = [...new Array(6)].map((_, index) => <PizzaSkeleton key={index} />);

  return (
    <div className="container">
      <div className="content__top">
        <Categories />
        <Sort />
      </div>
      <h2 className="content__title">Все пиццы</h2>
      <div className="content__items">{isLoading ? skeletons : pizzas}</div>
      <Pagination />
    </div>
  );
};

export default Home;
