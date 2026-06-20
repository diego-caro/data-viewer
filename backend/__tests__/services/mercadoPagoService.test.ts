import { mercadoPagoService } from '@/lib/services/mercadoPagoService';
import * as db from '@/lib/db';

jest.mock('@/lib/db');
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
const mockedQueryOne = db.queryOne as jest.MockedFunction<typeof db.queryOne>;

describe('mercadoPagoService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCaptainMpConfig', () => {
    it('should return captain MP config for a category', async () => {
      const configRow = {
        id: 'mp-1',
        category_id: 'cat-1',
        access_token: 'TEST-token-123',
        updated_at: '2026-06-19T00:00:00Z',
      };
      mockedQueryOne.mockResolvedValue(configRow);

      const result = await mercadoPagoService.getCaptainMpConfig('cat-1');

      expect(result).not.toBeNull();
      expect(result!.categoryId).toBe('cat-1');
      expect(result!.accessToken).toBe('TEST-token-123');
      expect(mockedQueryOne).toHaveBeenCalledWith(
        expect.stringContaining('captain_mp_config'),
        ['cat-1']
      );
    });

    it('should return null when no config exists for category', async () => {
      mockedQueryOne.mockResolvedValue(null);

      const result = await mercadoPagoService.getCaptainMpConfig('cat-99');

      expect(result).toBeNull();
    });
  });

  describe('createPaymentPreference', () => {
    it('should create a payment preference and return init_point', async () => {
      mp._mockPreferenceCreate.mockResolvedValue({
        id: 'pref-123',
        init_point: 'https://www.mercadopago.com/checkout/v1/redirect?pref_id=pref-123',
        sandbox_init_point: 'https://sandbox.mercadopago.com/checkout/v1/redirect?pref_id=pref-123',
      });

      const result = await mercadoPagoService.createPaymentPreference(
        'TEST-token-123',
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

    it('should throw when MP API fails', async () => {
      mp._mockPreferenceCreate.mockRejectedValue(new Error('MP API error'));

      await expect(
        mercadoPagoService.createPaymentPreference(
          'TEST-token-123', 300, 'pf-1', 'Test fee'
        )
      ).rejects.toThrow('Failed to create payment preference');
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

      const result = await mercadoPagoService.getPaymentStatus('TEST-token-123', '12345');

      expect(result.status).toBe('approved');
      expect(result.externalReference).toBe('pf-1');
      expect(result.transactionAmount).toBe(300);
      expect(mp.Payment).toHaveBeenCalled();
      expect(mp._mockPaymentGet).toHaveBeenCalledWith(
        expect.objectContaining({ id: '12345' })
      );
    });

    it('should throw when payment not found', async () => {
      mp._mockPaymentGet.mockRejectedValue(new Error('Not found'));

      await expect(
        mercadoPagoService.getPaymentStatus('TEST-token-123', '99999')
      ).rejects.toThrow('Failed to get payment status');
    });
  });
});
