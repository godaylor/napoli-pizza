import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useLocale } from '../shared/i18n/useLocale';

interface RouteErrorBoundaryProps { children: ReactNode; resetKey: string; onError?: (error: Error, info: ErrorInfo) => void; }
interface RouteErrorBoundaryState { error: Error | null; }

function RouteErrorFallback({ retry }: { retry: () => void }) {
  const { t } = useLocale();
  return <section className="route-error container" role="alert"><span className="status-code">ERROR / NAP</span><h1>{t('Не удалось открыть страницу', 'Could not open the page')}</h1><p>{t('Повторите действие или вернитесь в меню.', 'Retry or return to the menu.')}</p><div className="route-error__actions"><button type="button" onClick={retry}>{t('Повторить', 'Retry')}</button><Link className="secondary-link" to="/menu">{t('В меню', 'Menu')}</Link></div></section>;
}

export class RouteErrorBoundary extends Component<RouteErrorBoundaryProps, RouteErrorBoundaryState> {
  state: RouteErrorBoundaryState = { error: null };
  static getDerivedStateFromError(error: unknown): RouteErrorBoundaryState { return { error: error instanceof Error ? error : new Error('Unknown route error') }; }
  componentDidCatch(error: Error, info: ErrorInfo) { this.props.onError?.(error, info); }
  componentDidUpdate(previousProps: RouteErrorBoundaryProps) { if (this.state.error && previousProps.resetKey !== this.props.resetKey) { this.setState({ error: null }); } }
  private retry = () => { this.setState({ error: null }); };
  render() {
    if (this.state.error) {
      return <RouteErrorFallback retry={this.retry} />;
    }
    return this.props.children;
  }
}
