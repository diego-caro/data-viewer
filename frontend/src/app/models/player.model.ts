export type PlayerStatus = 'active' | 'inactive';

export interface Player {
  id: string;
  number: number;
  firstName: string;
  lastName: string;
  status: PlayerStatus;
  categoryId: string;
}

export interface Category {
  id: string;
  name: string;
}

export interface PlayersResponse {
  data: Player[];
  category: Category | null;
}

export interface CategoriesResponse {
  data: Category[];
}
