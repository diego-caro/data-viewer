export type FeeStatus = 'pending' | 'paid';

export interface PlayerFee {
  id: string;
  categoryFeeId: string;
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
  weekStartDate: string;
  createdBy: string;
  createdAt: string;
  playerFees: PlayerFee[];
  paidCount: number;
  unpaidCount: number;
}

export interface CreateFeeRequest {
  categoryId: string;
  totalAmount: number;
  availablePlayers: number;
}

export interface PaymentPreferenceResult {
  preferenceId: string;
  initPoint: string;
  sandboxInitPoint: string;
}
