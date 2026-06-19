import { Player, Category } from '@/lib/types/player';

const CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'Sub 14' },
  { id: 'cat-2', name: 'Sub 16' },
  { id: 'cat-3', name: 'Sub 19' },
  { id: 'cat-4', name: 'Primera' },
  { id: 'cat-5', name: 'Intermedia' },
  { id: 'cat-6', name: 'Caballeros' },
];

const PLAYERS: Player[] = [
  { id: 'p-01', number: 1, firstName: 'Mateo', lastName: 'Alvarez', status: 'active', categoryId: 'cat-1' },
  { id: 'p-02', number: 2, firstName: 'Valentina', lastName: 'Bravo', status: 'active', categoryId: 'cat-1' },
  { id: 'p-03', number: 3, firstName: 'Lucas', lastName: 'Castro', status: 'inactive', categoryId: 'cat-1' },

  { id: 'p-04', number: 1, firstName: 'Sofia', lastName: 'Diaz', status: 'active', categoryId: 'cat-2' },
  { id: 'p-05', number: 2, firstName: 'Benjamin', lastName: 'Espinoza', status: 'active', categoryId: 'cat-2' },
  { id: 'p-06', number: 3, firstName: 'Isabella', lastName: 'Fernandez', status: 'active', categoryId: 'cat-2' },
  { id: 'p-07', number: 4, firstName: 'Santiago', lastName: 'Gonzalez', status: 'inactive', categoryId: 'cat-2' },

  { id: 'p-08', number: 1, firstName: 'Camila', lastName: 'Herrera', status: 'active', categoryId: 'cat-3' },
  { id: 'p-09', number: 2, firstName: 'Tomas', lastName: 'Ibanez', status: 'active', categoryId: 'cat-3' },
  { id: 'p-10', number: 3, firstName: 'Martina', lastName: 'Jimenez', status: 'inactive', categoryId: 'cat-3' },

  { id: 'p-11', number: 1, firstName: 'Joaquin', lastName: 'Klein', status: 'active', categoryId: 'cat-4' },
  { id: 'p-12', number: 2, firstName: 'Emilia', lastName: 'Lopez', status: 'active', categoryId: 'cat-4' },
  { id: 'p-13', number: 3, firstName: 'Nicolas', lastName: 'Morales', status: 'inactive', categoryId: 'cat-4' },
  { id: 'p-14', number: 4, firstName: 'Antonella', lastName: 'Nunez', status: 'active', categoryId: 'cat-4' },

  { id: 'p-15', number: 1, firstName: 'Felipe', lastName: 'Ortega', status: 'active', categoryId: 'cat-5' },
  { id: 'p-16', number: 2, firstName: 'Renata', lastName: 'Perez', status: 'active', categoryId: 'cat-5' },
  { id: 'p-17', number: 3, firstName: 'Diego', lastName: 'Quiroga', status: 'inactive', categoryId: 'cat-5' },

  { id: 'p-18', number: 1, firstName: 'Catalina', lastName: 'Reyes', status: 'active', categoryId: 'cat-6' },
  { id: 'p-19', number: 2, firstName: 'Agustin', lastName: 'Silva', status: 'active', categoryId: 'cat-6' },
];

function getCategories(): Category[] {
  return [...CATEGORIES];
}

function getPlayersByCategory(categoryId: string): Player[] {
  return PLAYERS
    .filter((player) => player.categoryId === categoryId)
    .sort((a, b) => a.lastName.localeCompare(b.lastName));
}

function getCategoryById(categoryId: string): Category | null {
  return CATEGORIES.find((category) => category.id === categoryId) ?? null;
}

export const playerService = {
  getCategories,
  getPlayersByCategory,
  getCategoryById,
};
