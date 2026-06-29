export type FeeStatus = 'pending' | 'paid';
export type PaymentType = 'match' | 'league' | 'travel';

export interface PlayerFee {
  id: string;
  feeId: string;
  userId: string;
  playerName: string;
  status: FeeStatus;
  paidAt: string | null;
}

export interface CategoryFee {
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
  playerFees: PlayerFee[];
  paidCount: number;
  unpaidCount: number;
}

export interface CreateFeeRequest {
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
