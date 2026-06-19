import { playerService } from '@/lib/services/playerService';
import { Player, Category } from '@/lib/types/player';

describe('PlayerService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCategories', () => {
    it('should return all categories', () => {
      const categories = playerService.getCategories();

      expect(categories).toBeDefined();
      expect(Array.isArray(categories)).toBe(true);
      expect(categories.length).toBeGreaterThan(0);
      categories.forEach((category: Category) => {
        expect(category).toHaveProperty('id');
        expect(category).toHaveProperty('name');
      });
    });

    it('should return exactly 6 categories with correct names', () => {
      const categories = playerService.getCategories();
      const expectedNames = ['Sub 14', 'Sub 16', 'Sub 19', 'Primera', 'Intermedia', 'Caballeros'];

      expect(categories).toHaveLength(6);
      expect(categories.map((c: Category) => c.name)).toEqual(expectedNames);
    });
  });

  describe('getPlayersByCategory', () => {
    it('should return players for a valid category', () => {
      const categories = playerService.getCategories();
      const firstCategoryId = categories[0].id;

      const players = playerService.getPlayersByCategory(firstCategoryId);

      expect(players).toBeDefined();
      expect(Array.isArray(players)).toBe(true);
      expect(players.length).toBeGreaterThan(0);
      players.forEach((player: Player) => {
        expect(player.categoryId).toBe(firstCategoryId);
      });
    });

    it('should return an empty array for a non-existent category', () => {
      const players = playerService.getPlayersByCategory('non-existent-id');

      expect(players).toEqual([]);
    });

    it('should return players sorted alphabetically by last name', () => {
      const categories = playerService.getCategories();
      const firstCategoryId = categories[0].id;

      const players = playerService.getPlayersByCategory(firstCategoryId);

      for (let i = 1; i < players.length; i++) {
        expect(
          players[i - 1].lastName.localeCompare(players[i].lastName)
        ).toBeLessThanOrEqual(0);
      }
    });

    it('should include players with both active and inactive statuses', () => {
      const categories = playerService.getCategories();
      const allPlayers = categories.flatMap((c: Category) =>
        playerService.getPlayersByCategory(c.id)
      );
      const statuses = new Set(allPlayers.map((p: Player) => p.status));

      expect(statuses.has('active')).toBe(true);
      expect(statuses.has('inactive')).toBe(true);
    });

    it('should return players with all required fields', () => {
      const categories = playerService.getCategories();
      const players = playerService.getPlayersByCategory(categories[0].id);

      players.forEach((player: Player) => {
        expect(player).toHaveProperty('id');
        expect(player).toHaveProperty('number');
        expect(player).toHaveProperty('firstName');
        expect(player).toHaveProperty('lastName');
        expect(player).toHaveProperty('status');
        expect(player).toHaveProperty('categoryId');
        expect(typeof player.number).toBe('number');
      });
    });
  });

  describe('getCategoryById', () => {
    it('should return a category when it exists', () => {
      const categories = playerService.getCategories();
      const firstCategory = categories[0];

      const result = playerService.getCategoryById(firstCategory.id);

      expect(result).toEqual(firstCategory);
    });

    it('should return null for a non-existent category', () => {
      const result = playerService.getCategoryById('non-existent-id');

      expect(result).toBeNull();
    });
  });
});
