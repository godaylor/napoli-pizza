import React from 'react';

import { useSelector, useDispatch } from 'react-redux';
import { setActiveCategory } from '../redux/slices/filterSlice';

function Categories() {
  const categories = ['Все', 'Мясные', 'Вегетарианская', 'Гриль', 'Острые', 'Закрытые'];

  const dispatch = useDispatch();
  const category = useSelector(state => state.filter.activeCategory);

  return (
    <div className="categories">
      <ul>
        {categories.map((categoryName, index) => (
          <li
            key={categoryName}
            onClick={() => dispatch(setActiveCategory(index))}
            className={category === index ? 'active' : ''}>
            {categoryName}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Categories;
