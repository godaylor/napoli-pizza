import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';

import App from './App';
import { store } from './redux/store';
import { LocaleProvider } from './shared/i18n/LocaleProvider';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element was not found');
}

ReactDOM.createRoot(rootElement).render(
  <BrowserRouter
    future={{
      v7_relativeSplatPath: true,
      v7_startTransition: true,
    }}>
    <LocaleProvider>
      <Provider store={store}>
        <App />
      </Provider>
    </LocaleProvider>
  </BrowserRouter>,
);
