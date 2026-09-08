import request from 'supertest';
import app from '../src/app.js';
import User from '../src/models/User.js';
import { generateToken } from '../src/utils/generateToken.js';

let counter = 0;
export function uniqueEmail(prefix = 'user') {
  counter += 1;
  return `${prefix}${Date.now()}${counter}@test.com`;
}

// Registers a user through the real /api/auth/register endpoint so tests exercise
// the same code path (password hashing, role restriction, token signing) as production.
export async function registerUser({ name = 'Test User', email, password = 'password123', role = 'student' } = {}) {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ name, email: email || uniqueEmail(role), password, role });
  return res.body; // { user: { id, name, email, role }, token }
}

export function authHeader(token) {
  return { Authorization: `Bearer ${token}` };
}

// Admin accounts aren't provisioned through public registration (see authController.js),
// so tests create one directly against the model, the same way the real makeAdmin.js
// promotion script would result in an admin User document.
export async function createAdmin({ name = 'Admin', email, password = 'password123' } = {}) {
  const user = await User.create({ name, email: email || uniqueEmail('admin'), password, role: 'admin' });
  return { user, token: generateToken(user._id) };
}
