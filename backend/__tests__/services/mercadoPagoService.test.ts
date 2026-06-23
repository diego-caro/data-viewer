import { mercadoPagoService } from '@/lib/services/mercadoPagoService';

jest.mock('mercadopago', () => {
  const mockPreferenceCreate = jest.fn();
  const mockPaymentGet = jest.fn();
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({})),
    MercadoPagoConfig: jest.fn().mockImplementation(() => ({})),
    Preference: jest.fn().mockImplementation(() => ({
      create: mockPreferenceCreate,
    })),
    Payment: jest.fn().mockImplementation(() => ({
      get: mockPaymentGet,
    })),
    _mockPreferenceCreate: mockPreferenceCreate,
    _mockPaymentGet: mockPaymentGet,
  };
});

const mp = jest.requireMock('mercadopago');

describe('mercadoPagoService', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv, MP_ACCESS_TOKEN: 'TEST-token-123' };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('createPaymentPreference', () => {
    it('should create a payment preference and return init_point', async () => {
      mp._mockPreferenceCreate.mockResolvedValue({
        id: 'pref-123',
        init_point: 'https://www.mercadopago.com/checkout/v1/redirect?pref_id=pref-123',
        sandbox_init_point: 'https://sandbox.mercadopago.com/checkout/v1/redirect?pref_id=pref-123',
      });

      const result = await mercadoPagoService.createPaymentPreference(
        300,
        'pf-1',
        'Player One - Sub 14 fee'
      );

      expect(result.preferenceId).toBe('pref-123');
      expect(result.initPoint).toContain('mercadopago.com');
      expect(result.sandboxInitPoint).toContain('sandbox');
      expect(mp.Preference).toHaveBeenCalled();
      expect(mp._mockPreferenceCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.objectContaining({
            items: expect.arrayContaining([
              expect.objectContaining({
                unit_price: 300,
                quantity: 1,
              }),
            ]),
            external_reference: 'pf-1',
          }),
        })
      );
    });

    it('should throw when MP_ACCESS_TOKEN is not configured', async () => {
      delete process.env.MP_ACCESS_TOKEN;

      await expect(
        mercadoPagoService.createPaymentPreference(300, 'pf-1', 'Test fee')
      ).rejects.toThrow('MP_ACCESS_TOKEN is not configured');
    });
  });

  describe('getPaymentStatus', () => {
    it('should return payment details', async () => {
      mp._mockPaymentGet.mockResolvedValue({
        id: 12345,
        status: 'approved',
        external_reference: 'pf-1',
        transaction_amount: 300,
      });

      const result = await mercadoPagoService.getPaymentStatus('12345');

      expect(result.status).toBe('approved');
      expect(result.externalReference).toBe('pf-1');
      expect(result.transactionAmount).toBe(300);
      expect(mp.Payment).toHaveBeenCalled();
      expect(mp._mockPaymentGet).toHaveBeenCalledWith(
        expect.objectContaining({ id: '12345' })
      );
    });

    it('should throw when MP_ACCESS_TOKEN is not configured', async () => {
      delete process.env.MP_ACCESS_TOKEN;

      await expect(
        mercadoPagoService.getPaymentStatus('12345')
      ).rejects.toThrow('MP_ACCESS_TOKEN is not configured');
    });
  });
});
