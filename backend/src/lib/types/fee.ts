export type FeeStatus = 'pending' | 'paid';

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
}

export interface CaptainMpConfig {
  id: string;
  categoryId: string;
  accessToken: string;
  updatedAt: string;
}

export interface PaymentPreferenceResult {
  preferenceId: string;
  initPoint: string;
  sandboxInitPoint: string;
}
