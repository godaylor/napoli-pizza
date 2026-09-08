export type MockPaymentScenario =
  | 'success'
  | 'decline'
  | 'timeout-after-create'
  | 'error';

export type PaymentState =
  | { status: 'idle'; message: string }
  | { status: 'pending'; message: string }
  | { status: 'declined'; message: string }
  | { status: 'recovering'; message: string }
  | { status: 'failed'; message: string }
  | { status: 'succeeded'; message: string; orderId: string };

export type PaymentAction =
  | { type: 'submit' }
  | { type: 'decline'; message: string }
  | { type: 'ambiguous' }
  | { type: 'fail'; message: string }
  | { type: 'success'; orderId: string }
  | { type: 'reset' };

export const initialPaymentState: PaymentState = {
  status: 'idle',
  message: '',
};

export const paymentReducer = (
  state: PaymentState,
  action: PaymentAction,
): PaymentState => {
  switch (action.type) {
    case 'submit':
      if (state.status === 'pending' || state.status === 'recovering') {
        return state;
      }
      return {
        status: 'pending',
        message: 'Проверяем demo payment и создаём заказ…',
      };
    case 'decline':
      return { status: 'declined', message: action.message };
    case 'ambiguous':
      return {
        status: 'recovering',
        message: 'Ответ потерян. Проверяем заказ по idempotency key…',
      };
    case 'fail':
      return { status: 'failed', message: action.message };
    case 'success':
      return {
        status: 'succeeded',
        message: 'Заказ подтверждён.',
        orderId: action.orderId,
      };
    case 'reset':
      return initialPaymentState;
    default:
      return state;
  }
};