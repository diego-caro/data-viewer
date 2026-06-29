import { POST } from '@/app/api/payments/webhook/route';
import { paymentService } from '@/lib/services/paymentService';
import { mercadoPagoService } from '@/lib/services/mercadoPagoService';
import { NextRequest } from 'next/server';

jest.mock('@/lib/services/paymentService');
jest.mock('@/lib/services/mercadoPagoService');
jest.mock('mercadopago', () => ({
  WebhookSignatureValidator: {
    validate: jest.fn(),
  },
  InvalidWebhookSignatureError: class InvalidWebhookSignatureError extends Error {
    readonly reason: string;
    constructor(reason: string) {
      super(reason);
      this.reason = reason;
    }
  },
}));

const mockedPaymentService = paymentService as jest.Mocked<typeof paymentService>;
const mockedMpService = mercadoPagoService as jest.Mocked<typeof mercadoPagoService>;

function createWebhookRequest(body: unknown, query?: string): NextRequest {
  const url = query
    ? `http://localhost:3000/api/payments/webhook?${query}`
    : 'http://localhost:3000/api/payments/webhook';
  return new NextRequest(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/payments/webhook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should mark player as paid on approved payment notification', async () => {
    mockedPaymentService.getPlayerFeeWithCategory.mockResolvedValue({
      playerFee: {
        id: 'pf-1', feeId: 'mf-1', userId: 'u1',
        playerName: 'One, Player', status: 'pending', paidAt: null,
      },
      categoryId: 'cat-1',
      perPlayerAmount: 300,
      paymentType: 'match',
    });
    mockedMpService.getPaymentStatus.mockResolvedValue({
      paymentId: '12345',
      status: 'approved',
      externalReference: 'pf-1',
      transactionAmount: 300,
    });
    mockedPaymentService.markPlayerPaid.mockResolvedValue({
      playerFee: {
        id: 'pf-1', feeId: 'mf-1', userId: 'u1',
        playerName: 'One, Player', status: 'paid', paidAt: '2026-06-19T10:00:00Z',
      },
      paymentType: 'match',
    });

    const response = await POST(createWebhookRequest(
      { type: 'payment', data: { id: '12345' } },
      'playerFeeId=pf-1'
    ));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe('paid');
    expect(mockedPaymentService.getPlayerFeeWithCategory).toHaveBeenCalledWith('pf-1');
    expect(mockedMpService.getPaymentStatus).toHaveBeenCalledWith('12345');
    expect(mockedPaymentService.markPlayerPaid).toHaveBeenCalledWith('pf-1');
  });

  it('should return 200 and skip non-payment notifications', async () => {
    const response = await POST(createWebhookRequest(
      { type: 'plan', data: { id: '999' } },
      'playerFeeId=pf-1'
    ));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe('ignored');
    expect(mockedMpService.getPaymentStatus).not.toHaveBeenCalled();
  });

  it('should return 200 and skip non-approved payments', async () => {
    mockedPaymentService.getPlayerFeeWithCategory.mockResolvedValue({
      playerFee: {
        id: 'pf-1', feeId: 'mf-1', userId: 'u1',
        playerName: 'One, Player', status: 'pending', paidAt: null,
      },
      categoryId: 'cat-1',
      perPlayerAmount: 300,
      paymentType: 'match',
    });
    mockedMpService.getPaymentStatus.mockResolvedValue({
      paymentId: '12345',
      status: 'rejected',
      externalReference: 'pf-1',
      transactionAmount: 300,
    });

    const response = await POST(createWebhookRequest(
      { type: 'payment', data: { id: '12345' } },
      'playerFeeId=pf-1'
    ));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe('not_approved');
    expect(mockedPaymentService.markPlayerPaid).not.toHaveBeenCalled();
  });

  it('should return 400 when data.id is missing', async () => {
    const response = await POST(createWebhookRequest(
      { type: 'payment', data: {} },
      'playerFeeId=pf-1'
    ));

    expect(response.status).toBe(400);
  });

  it('should return 400 when playerFeeId query param is missing', async () => {
    const response = await POST(createWebhookRequest(
      { type: 'payment', data: { id: '12345' } }
    ));

    expect(response.status).toBe(400);
  });

  it('should return 404 when player fee not found', async () => {
    mockedPaymentService.getPlayerFeeWithCategory.mockResolvedValue(null);

    const response = await POST(createWebhookRequest(
      { type: 'payment', data: { id: '12345' } },
      'playerFeeId=pf-unknown'
    ));

    expect(response.status).toBe(404);
  });

  it('should return 200 with already_paid when fee is already paid', async () => {
    mockedPaymentService.getPlayerFeeWithCategory.mockResolvedValue({
      playerFee: {
        id: 'pf-1', feeId: 'mf-1', userId: 'u1',
        playerName: 'One, Player', status: 'paid', paidAt: '2026-06-18T10:00:00Z',
      },
      categoryId: 'cat-1',
      perPlayerAmount: 300,
      paymentType: 'match',
    });

    const response = await POST(createWebhookRequest(
      { type: 'payment', data: { id: '12345' } },
      'playerFeeId=pf-1'
    ));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe('already_paid');
    expect(mockedPaymentService.markPlayerPaid).not.toHaveBeenCalled();
  });

  it('should return 400 when payment external_reference does not match playerFeeId', async () => {
    mockedPaymentService.getPlayerFeeWithCategory.mockResolvedValue({
      playerFee: {
        id: 'pf-1', feeId: 'mf-1', userId: 'u1',
        playerName: 'One, Player', status: 'pending', paidAt: null,
      },
      categoryId: 'cat-1',
      perPlayerAmount: 300,
      paymentType: 'match',
    });
    mockedMpService.getPaymentStatus.mockResolvedValue({
      paymentId: '12345',
      status: 'approved',
      externalReference: 'pf-OTHER',
      transactionAmount: 300,
    });

    const response = await POST(createWebhookRequest(
      { type: 'payment', data: { id: '12345' } },
      'playerFeeId=pf-1'
    ));

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('mismatch');
    expect(mockedPaymentService.markPlayerPaid).not.toHaveBeenCalled();
  });

  describe('webhook signature validation', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      process.env = { ...originalEnv, MP_WEBHOOK_SECRET: 'test-secret' };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it('should return 401 when signature is invalid', async () => {
      const mp = jest.requireMock('mercadopago');
      mp.WebhookSignatureValidator.validate.mockImplementation(() => {
        throw new mp.InvalidWebhookSignatureError('SignatureMismatch');
      });

      const response = await POST(createWebhookRequest(
        { type: 'payment', data: { id: '12345' } },
        'playerFeeId=pf-1'
      ));

      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body.error).toContain('signature');
    });

    it('should proceed when signature is valid', async () => {
      const mp = jest.requireMock('mercadopago');
      mp.WebhookSignatureValidator.validate.mockImplementation(() => {});

      mockedPaymentService.getPlayerFeeWithCategory.mockResolvedValue({
        playerFee: {
          id: 'pf-1', feeId: 'mf-1', userId: 'u1',
          playerName: 'One, Player', status: 'pending', paidAt: null,
        },
        categoryId: 'cat-1',
        perPlayerAmount: 300,
        paymentType: 'match',
      });
      mockedMpService.getPaymentStatus.mockResolvedValue({
        paymentId: '12345',
        status: 'approved',
        externalReference: 'pf-1',
        transactionAmount: 300,
      });
      mockedPaymentService.markPlayerPaid.mockResolvedValue({
        playerFee: {
          id: 'pf-1', feeId: 'mf-1', userId: 'u1',
          playerName: 'One, Player', status: 'paid', paidAt: '2026-06-19T10:00:00Z',
        },
        paymentType: 'match',
      });

      const response = await POST(createWebhookRequest(
        { type: 'payment', data: { id: '12345' } },
        'playerFeeId=pf-1'
      ));

      expect(response.status).toBe(200);
      expect(mp.WebhookSignatureValidator.validate).toHaveBeenCalled();
    });
  });
});
