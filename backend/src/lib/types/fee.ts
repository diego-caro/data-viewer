export type FeeStatus = 'pending' | 'paid';
export type FeeType = 'fee' | 'travel';

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
  type: FeeType;
}

export interface PlayerFee {
  id: string;
  categoryFeeId: string;
  userId: string;
  playerName: string;
  status: FeeStatus;
  paidAt: string | null;
}

export interface CategoryFeeWithPlayers extends CategoryFee {
  playerFees: PlayerFee[];
  paidCount: number;
  unpaidCount: number;
}

export interface CreateCategoryFeeRequest {
  categoryId: string;
  totalAmount: number;
  availablePlayers: number;
  type?: FeeType;
}

export interface PaymentPreferenceResult {
  preferenceId: string;
  initPoint: string;
  sandboxInitPoint: string;
}
