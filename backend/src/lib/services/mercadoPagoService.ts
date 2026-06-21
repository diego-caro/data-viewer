import { query, queryOne } from '@/lib/db';
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

interface OAuthTokenResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  scope: string;
  userId: number;
}

function getOAuthUrl(state: string): string {
  const clientId = process.env.MP_CLIENT_ID;
  const redirectUri = process.env.MP_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    throw new Error('Mercado Pago OAuth not configured');
  }

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    platform_id: 'mp',
    redirect_uri: redirectUri,
    state,
  });

  return `https://auth.mercadopago.com/authorization?${params.toString()}`;
}

async function exchangeOAuthCode(code: string): Promise<OAuthTokenResponse> {
  const clientId = process.env.MP_CLIENT_ID;
  const clientSecret = process.env.MP_CLIENT_SECRET;
  const redirectUri = process.env.MP_REDIRECT_URI;

  try {
    const response = await fetch('https://api.mercadopago.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    });

    if (!response.ok) {
      throw new Error('MP returned error');
    }

    const data = await response.json();
    return {
      accessToken: data.access_token,
      tokenType: data.token_type,
      expiresIn: data.expires_in,
      scope: data.scope,
      userId: data.user_id,
    };
  } catch {
    throw new Error('Failed to exchange OAuth code');
  }
}

async function saveCaptainMpConfig(categoryId: string, accessToken: string): Promise<CaptainMpConfig> {
  const rows = await query<CaptainMpConfigRow>(
    `INSERT INTO captain_mp_config (category_id, access_token, updated_at)
     VALUES ($1, $2, NOW())
     ON CONFLICT (category_id)
     DO UPDATE SET access_token = $2, updated_at = NOW()
     RETURNING *`,
    [categoryId, accessToken]
  );

  const row = rows[0];
  return {
    id: row.id,
    categoryId: row.category_id,
    accessToken: row.access_token,
    updatedAt: row.updated_at,
  };
}

export const mercadoPagoService = {
  getCaptainMpConfig,
  createPaymentPreference,
  getPaymentStatus,
  getOAuthUrl,
  exchangeOAuthCode,
  saveCaptainMpConfig,
};
