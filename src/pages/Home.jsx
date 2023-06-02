import React from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';

import Categories from '../components/Categories';
import Sort from '../components/Sort';
import PizzaBlock from '../components/PizzaBlock';
import PizzaSkeleton from '../components/PizzaBlock/PizzaSkeleton';
import Pagination from '../components/Pagination';

import { SearchContext } from '../App';

const Home = () => {
  const { activeCategory, sort } = useSelector((state) => state.filter);

  const { searchValue } = React.useContext(SearchContext);
  const [items, setItems] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [currentPage, setCurrentPage] = React.useState(1);

  React.useEffect(() => {
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

    window.scrollTo(0, 0);
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
      <Pagination onChangePage={(number) => setCurrentPage(number)} />
    </div>
  );
};

export default Home;
