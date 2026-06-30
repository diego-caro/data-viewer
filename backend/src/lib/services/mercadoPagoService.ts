import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
import { PaymentPreferenceResult } from '@/lib/types/payment';

interface PaymentStatusResult {
  paymentId: string;
  status: string;
  externalReference: string;
  transactionAmount: number;
}

function getAccessToken(): string {
  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) {
    throw new Error('MP_ACCESS_TOKEN is not configured');
  }
  return token;
}

async function createPaymentPreference(
  amount: number,
  playerFeeId: string,
  description: string,
  notificationUrl?: string
): Promise<PaymentPreferenceResult> {
  const config = new MercadoPagoConfig({ accessToken: getAccessToken() });
  const preference = new Preference(config);

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
  const feesUrl = `${frontendUrl}/fees`;
  const isHttps = frontendUrl.startsWith('https://');

  const response = await preference.create({
    body: {
      items: [
        {
          id: playerFeeId,
          title: description,
          quantity: 1,
          unit_price: amount,
          currency_id: 'ARS',
        },
      ],
      external_reference: playerFeeId,
      binary_mode: true,
      back_urls: {
        success: `${feesUrl}?payment=success`,
        failure: `${feesUrl}?payment=failure`,
        pending: `${feesUrl}?payment=pending`,
      },
      ...(isHttps ? { auto_return: 'approved' } : {}),
      ...(notificationUrl ? { notification_url: notificationUrl } : {}),
    },
  });

  return {
    preferenceId: response.id!,
    initPoint: response.init_point!,
    sandboxInitPoint: response.sandbox_init_point!,
  };
}

async function getPaymentStatus(paymentId: string): Promise<PaymentStatusResult> {
  const config = new MercadoPagoConfig({ accessToken: getAccessToken() });
  const payment = new Payment(config);

  const response = await payment.get({ id: paymentId });

  return {
    paymentId: String(response.id),
    status: response.status!,
    externalReference: response.external_reference!,
    transactionAmount: response.transaction_amount!,
  };
}

export const mercadoPagoService = {
  createPaymentPreference,
  getPaymentStatus,
};
