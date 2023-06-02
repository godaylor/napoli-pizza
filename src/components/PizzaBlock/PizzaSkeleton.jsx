import React from 'react';
import ContentLoader from 'react-content-loader';

const PizzaSkeleton = () => (
  <ContentLoader
    className="pizza-block"
    speed={2}
    width={280}
    height={466}
    // marginRight={35}
    // marginBottom={65}
    viewBox="0 0 280 466"
    backgroundColor="#f3f3f3"
    foregroundColor="#ecebeb">
    <circle cx="133" cy="121" r="121" />
    <rect x="0" y="267" rx="10" ry="10" width="280" height="25" />
    <rect x="0" y="312" rx="10" ry="10" width="280" height="90" />
    <rect x="0" y="428" rx="10" ry="10" width="90" height="33" />
    <rect x="127" y="422" rx="25" ry="25" width="150" height="45" />
  </ContentLoader>
);

export default PizzaSkeleton;
