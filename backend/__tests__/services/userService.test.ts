import { userService } from '@/lib/services/userService';
import * as db from '@/lib/db';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';

jest.mock('@/lib/db');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

const mockedDb = db as jest.Mocked<typeof db>;
const mockedBcrypt = bcryptjs as jest.Mocked<typeof bcryptjs>;
const mockedJwt = jwt as jest.Mocked<typeof jwt>;

const mockUserRow = {
  id: 'user-1',
  email: 'admin@cec.com',
  password_hash: '$2b$10$hashedpassword',
  role: 'admin' as const,
  first_name: 'Admin',
  last_name: 'CEC',
  category_id: null,
  player_number: null,
};

describe('userService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('findByEmail', () => {
    it('should return a user when found', async () => {
      mockedDb.queryOne.mockResolvedValue(mockUserRow);

      const user = await userService.findByEmail('admin@cec.com');

      expect(user).toEqual({
        id: 'user-1',
        email: 'admin@cec.com',
        passwordHash: '$2b$10$hashedpassword',
        role: 'admin',
        firstName: 'Admin',
        lastName: 'CEC',
        categoryId: null,
        playerNumber: null,
      });
      expect(mockedDb.queryOne).toHaveBeenCalledWith(
        expect.stringContaining('WHERE email = $1'),
        ['admin@cec.com']
      );
    });

    it('should return null when user not found', async () => {
      mockedDb.queryOne.mockResolvedValue(null);

      const user = await userService.findByEmail('nobody@cec.com');

      expect(user).toBeNull();
    });
  });

  describe('findById', () => {
    it('should return a user when found', async () => {
      mockedDb.queryOne.mockResolvedValue(mockUserRow);

      const user = await userService.findById('user-1');

      expect(user).not.toBeNull();
      expect(user!.id).toBe('user-1');
      expect(mockedDb.queryOne).toHaveBeenCalledWith(
        expect.stringContaining('WHERE id = $1'),
        ['user-1']
      );
    });

    it('should return null when user not found', async () => {
      mockedDb.queryOne.mockResolvedValue(null);

      const user = await userService.findById('nonexistent');

      expect(user).toBeNull();
    });
  });

  describe('login', () => {
    it('should return token and profile on valid credentials', async () => {
      mockedDb.queryOne.mockResolvedValue(mockUserRow);
      (mockedBcrypt.compare as jest.Mock).mockResolvedValue(true);
      (mockedJwt.sign as jest.Mock).mockReturnValue('mock-jwt-token');

      const result = await userService.login('admin@cec.com', 'admin123');

      expect(result).not.toBeNull();
      expect(result!.token).toBe('mock-jwt-token');
      expect(result!.user).toEqual({
        id: 'user-1',
        email: 'admin@cec.com',
        role: 'admin',
        firstName: 'Admin',
        lastName: 'CEC',
        categoryId: null,
        playerNumber: null,
      });
      expect(result!.user).not.toHaveProperty('passwordHash');
    });

    it('should return null when user not found', async () => {
      mockedDb.queryOne.mockResolvedValue(null);

      const result = await userService.login('nobody@cec.com', 'password');

      expect(result).toBeNull();
    });

    it('should return null when password is incorrect', async () => {
      mockedDb.queryOne.mockResolvedValue(mockUserRow);
      (mockedBcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await userService.login('admin@cec.com', 'wrong-password');

      expect(result).toBeNull();
    });
  });

  describe('verifyToken', () => {
    it('should return payload for valid token', () => {
      const payload = { userId: 'user-1', role: 'admin' };
      (mockedJwt.verify as jest.Mock).mockReturnValue(payload);

      const result = userService.verifyToken('valid-token');

      expect(result).toEqual(payload);
    });

    it('should return null for invalid token', () => {
      (mockedJwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('invalid token');
      });

      const result = userService.verifyToken('bad-token');

      expect(result).toBeNull();
    });
  });

  describe('getProfile', () => {
    it('should return user profile without passwordHash', async () => {
      mockedDb.queryOne.mockResolvedValue(mockUserRow);

      const profile = await userService.getProfile('user-1');

      expect(profile).not.toBeNull();
      expect(profile).toEqual({
        id: 'user-1',
        email: 'admin@cec.com',
        role: 'admin',
        firstName: 'Admin',
        lastName: 'CEC',
        categoryId: null,
        playerNumber: null,
      });
      expect(profile).not.toHaveProperty('passwordHash');
    });

    it('should return null when user not found', async () => {
      mockedDb.queryOne.mockResolvedValue(null);

      const profile = await userService.getProfile('nonexistent');

      expect(profile).toBeNull();
    });
  });

  describe('createUser', () => {
    it('should hash password and insert user', async () => {
      (mockedBcrypt.hash as jest.Mock).mockResolvedValue('$2b$10$newhash');
      mockedDb.query.mockResolvedValue([{
        ...mockUserRow,
        id: 'new-user',
        password_hash: '$2b$10$newhash',
      }]);

      const profile = await userService.createUser(
        'new@cec.com', 'password123', 'player', 'New', 'User', 'cat-1'
      );

      expect(mockedBcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(mockedDb.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO users'),
        ['new@cec.com', '$2b$10$newhash', 'player', 'New', 'User', 'cat-1', null]
      );
      expect(profile).not.toHaveProperty('passwordHash');
      expect(profile.email).toBe('admin@cec.com');
    });
  });

  describe('seedDefaultAdmin', () => {
    it('should create admin when no users exist', async () => {
      mockedDb.query
        .mockResolvedValueOnce([{ count: '0' }])
        .mockResolvedValueOnce([mockUserRow]);
      (mockedBcrypt.hash as jest.Mock).mockResolvedValue('$2b$10$hashed');

      await userService.seedDefaultAdmin();

      expect(mockedDb.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO users'),
        expect.arrayContaining(['admin@cec.com'])
      );
    });

    it('should not create admin when users already exist', async () => {
      mockedDb.query.mockResolvedValueOnce([{ count: '1' }]);

      await userService.seedDefaultAdmin();

      expect(mockedDb.query).toHaveBeenCalledTimes(1);
    });
  });

  describe('updatePlayerNumber', () => {
    it('should update player number and return profile', async () => {
      mockedDb.query.mockResolvedValue([{
        ...mockUserRow,
        role: 'player',
        category_id: 'cat-1',
        player_number: 10,
      }]);

      const result = await userService.updatePlayerNumber('user-1', 10);

      expect(result).not.toBeNull();
      expect(result!.playerNumber).toBe(10);
      expect(mockedDb.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE users SET player_number'),
        [10, 'user-1']
      );
    });

    it('should return null when user not found', async () => {
      mockedDb.query.mockResolvedValue([]);

      const result = await userService.updatePlayerNumber('nonexistent', 10);

      expect(result).toBeNull();
    });

    it('should set player number to null', async () => {
      mockedDb.query.mockResolvedValue([{
        ...mockUserRow,
        role: 'player',
        category_id: 'cat-1',
        player_number: null,
      }]);

      const result = await userService.updatePlayerNumber('user-1', null);

      expect(result).not.toBeNull();
      expect(result!.playerNumber).toBeNull();
    });
  });

  describe('updateUser', () => {
    it('should update user fields without changing password', async () => {
      mockedDb.query.mockResolvedValue([{
        ...mockUserRow,
        email: 'updated@cec.com',
        first_name: 'Updated',
        last_name: 'Name',
      }]);

      const result = await userService.updateUser('user-1', {
        email: 'updated@cec.com',
        role: 'admin',
        firstName: 'Updated',
        lastName: 'Name',
        categoryId: null,
      });

      expect(result).not.toBeNull();
      expect(result!.email).toBe('updated@cec.com');
      expect(result!.firstName).toBe('Updated');
      expect(mockedDb.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE users SET'),
        expect.not.arrayContaining([expect.stringContaining('$2b$')])
      );
    });

    it('should hash and update password when provided', async () => {
      (mockedBcrypt.hash as jest.Mock).mockResolvedValue('$2b$10$newhash');
      mockedDb.query.mockResolvedValue([mockUserRow]);

      const result = await userService.updateUser('user-1', {
        email: 'admin@cec.com',
        role: 'admin',
        firstName: 'Admin',
        lastName: 'CEC',
        categoryId: null,
        password: 'newpass123',
      });

      expect(result).not.toBeNull();
      expect(mockedBcrypt.hash).toHaveBeenCalledWith('newpass123', 10);
      expect(mockedDb.query).toHaveBeenCalledWith(
        expect.stringContaining('password_hash'),
        expect.arrayContaining(['$2b$10$newhash'])
      );
    });

    it('should return null when user not found', async () => {
      mockedDb.query.mockResolvedValue([]);

      const result = await userService.updateUser('nonexistent', {
        email: 'test@cec.com',
        role: 'admin',
        firstName: 'Test',
        lastName: 'User',
        categoryId: null,
      });

      expect(result).toBeNull();
    });

    it('should clear categoryId when role is admin', async () => {
      mockedDb.query.mockResolvedValue([{
        ...mockUserRow,
        category_id: null,
      }]);

      await userService.updateUser('user-1', {
        email: 'admin@cec.com',
        role: 'admin',
        firstName: 'Admin',
        lastName: 'CEC',
        categoryId: null,
      });

      expect(mockedDb.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE users SET'),
        expect.arrayContaining([null])
      );
    });
  });

  describe('deleteUser', () => {
    it('should delete dependent player fees and the user', async () => {
      mockedDb.query
        .mockResolvedValueOnce([]) // DELETE match_player_fees
        .mockResolvedValueOnce([]) // DELETE league_player_fees
        .mockResolvedValueOnce([]) // DELETE travel_player_fees
        .mockResolvedValueOnce([{ id: 'user-1' }]); // DELETE user RETURNING id

      const result = await userService.deleteUser('user-1');

      expect(result).toBe(true);
      expect(mockedDb.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM match_player_fees'),
        ['user-1']
      );
      expect(mockedDb.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM league_player_fees'),
        ['user-1']
      );
      expect(mockedDb.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM travel_player_fees'),
        ['user-1']
      );
      expect(mockedDb.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM users'),
        ['user-1']
      );
    });

    it('should return false when user not found', async () => {
      mockedDb.query
        .mockResolvedValueOnce([]) // DELETE match_player_fees
        .mockResolvedValueOnce([]) // DELETE league_player_fees
        .mockResolvedValueOnce([]) // DELETE travel_player_fees
        .mockResolvedValueOnce([]); // DELETE user returns nothing

      const result = await userService.deleteUser('nonexistent');

      expect(result).toBe(false);
    });

    it('should throw descriptive error on FK constraint violation', async () => {
      const fkError = new Error('FK violation') as Error & { code: string };
      fkError.code = '23503';
      mockedDb.query
        .mockResolvedValueOnce([]) // DELETE match_player_fees
        .mockResolvedValueOnce([]) // DELETE league_player_fees
        .mockResolvedValueOnce([]) // DELETE travel_player_fees
        .mockRejectedValueOnce(fkError); // DELETE user FK error

      await expect(userService.deleteUser('user-1'))
        .rejects.toThrow('Cannot delete user with associated records');
    });
  });
});
