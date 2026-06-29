import type { Models } from '../src/models/types.js';

export async function up(models: Models): Promise<void> {
  const { User, hashPassword } = models;
  const existing = await User.findOne({ where: { username: 'admin' } });
  if (existing) return;
  await User.create({
    username: 'admin',
    password_hash: hashPassword('SecurePassword123'),
    role: 'admin',
  });
}
