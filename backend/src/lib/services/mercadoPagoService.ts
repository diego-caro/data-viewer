import { queryOne } from '@/lib/db';
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
import { CaptainMpConfig, PaymentPreferenceResult } from '@/lib/types/fee';

interface CaptainMpConfigRow {
  id: string;
  category_id: string;
  access_token: string;
  updated_at: string;
}

interface PaymentStatusResult {
  paymentId: string;
  status: string;
  externalReference: string;
  transactionAmount: number;
}

async function getCaptainMpConfig(categoryId: string): Promise<CaptainMpConfig | null> {
  const row = await queryOne<CaptainMpConfigRow>(
    'SELECT * FROM captain_mp_config WHERE category_id = $1',
    [categoryId]
  );

  if (!row) return null;

  return {
    id: row.id,
    categoryId: row.category_id,
    accessToken: row.access_token,
    updatedAt: row.updated_at,
  };
}

async function createPaymentPreference(
  accessToken: string,
  amount: number,
  playerFeeId: string,
  description: string,
  notificationUrl?: string
): Promise<PaymentPreferenceResult> {
  try {
    const config = new MercadoPagoConfig({ accessToken });
    const preference = new Preference(config);

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
        ...(notificationUrl ? { notification_url: notificationUrl } : {}),
      },
    });

    return {
      preferenceId: response.id!,
      initPoint: response.init_point!,
      sandboxInitPoint: response.sandbox_init_point!,
    };
  } catch (error) {
    throw new Error('Failed to create payment preference');
  }
}

async function getPaymentStatus(
  accessToken: string,
  paymentId: string
): Promise<PaymentStatusResult> {
  try {
    const config = new MercadoPagoConfig({ accessToken });
    const payment = new Payment(config);

    const response = await payment.get({ id: paymentId });

    return {
      paymentId: String(response.id),
      status: response.status!,
      externalReference: response.external_reference!,
      transactionAmount: response.transaction_amount!,
    };
  } catch (error) {
    throw new Error('Failed to get payment status');
  }
}

export const mercadoPagoService = {
  getCaptainMpConfig,
  createPaymentPreference,
  getPaymentStatus,
};
