export type PaymentType = 'match' | 'league' | 'travel';
export type FeeStatus = 'pending' | 'paid';

export interface PaymentFee {
  id: string;
  categoryId: string;
  categoryName: string;
  totalAmount: number;
  availablePlayers: number;
  perPlayerAmount: number;
  periodStartDate: string;
  createdBy: string;
  createdAt: string;
  type: PaymentType;
}

export interface PlayerPaymentFee {
  id: string;
  feeId: string;
  userId: string;
  playerName: string;
  status: FeeStatus;
  paidAt: string | null;
}

export interface PaymentFeeWithPlayers extends PaymentFee {
  playerFees: PlayerPaymentFee[];
  paidCount: number;
  unpaidCount: number;
}

export interface CreatePaymentFeeRequest {
  categoryId: string;
  totalAmount: number;
  availablePlayers: number;
  type?: PaymentType;
}

export interface PaymentPreferenceResult {
  preferenceId: string;
  initPoint: string;
  sandboxInitPoint: string;
}

export interface PlayerFeeWithCategory {
  playerFee: PlayerPaymentFee;
  categoryId: string;
  perPlayerAmount: number;
  paymentType: PaymentType;
}
