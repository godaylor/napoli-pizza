import React from 'react';

import styles from './NotFoundBlock.module.scss';

const NotFoundBlock = () => {
  return (
    <div className={styles.root}>
      <h2>
        <br />
        Ничего не найдено
      </h2>
      <p className={styles.descrition}>Данная страница отсутствует в нашем магазине</p>
    </div>
  );
};

export default NotFoundBlock;
