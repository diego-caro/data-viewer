import { userService } from '@/lib/services/userService';
import * as db from '@/lib/db';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

jest.mock('@/lib/db');
jest.mock('bcrypt');
jest.mock('jsonwebtoken');

const mockedDb = db as jest.Mocked<typeof db>;
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;
const mockedJwt = jwt as jest.Mocked<typeof jwt>;

const mockUserRow = {
  id: 'user-1',
  email: 'admin@cec.com',
  password_hash: '$2b$10$hashedpassword',
  role: 'admin' as const,
  first_name: 'Admin',
  last_name: 'CEC',
  category_id: null,
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
        ['new@cec.com', '$2b$10$newhash', 'player', 'New', 'User', 'cat-1']
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
});
