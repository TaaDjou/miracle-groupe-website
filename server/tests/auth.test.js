import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { registerUser, uniqueEmail, authHeader } from './helpers.js';

describe('auth', () => {
  it('registers a new user and returns a token', async () => {
    const email = uniqueEmail('register');
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Alice', email, password: 'password123', role: 'student' });

    expect(res.status).toBe(201);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user).toMatchObject({ name: 'Alice', email, role: 'student' });
    expect(res.body.user.password).toBeUndefined();
  });

  it('rejects registration with a duplicate email', async () => {
    const email = uniqueEmail('dup');
    await registerUser({ email });

    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Someone Else', email, password: 'password123' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/already exists/i);
  });

  it('forces self-registration role to student when an unrecognized role is supplied', async () => {
    const email = uniqueEmail('sneaky');
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Sneaky', email, password: 'password123', role: 'admin' });

    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('student');
  });

  it('allows self-registration as an instructor', async () => {
    const email = uniqueEmail('instructor');
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Teacher', email, password: 'password123', role: 'instructor' });

    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('instructor');
  });

  it('logs in with correct credentials', async () => {
    const email = uniqueEmail('login');
    await registerUser({ email, password: 'correct-password' });

    const res = await request(app).post('/api/auth/login').send({ email, password: 'correct-password' });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
  });

  it('rejects login with the wrong password', async () => {
    const email = uniqueEmail('badlogin');
    await registerUser({ email, password: 'correct-password' });

    const res = await request(app).post('/api/auth/login').send({ email, password: 'wrong-password' });

    expect(res.status).toBe(401);
  });

  it('rejects /api/auth/me without a token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('returns the current user for /api/auth/me with a valid token', async () => {
    const { token, user } = await registerUser({ name: 'Me', email: uniqueEmail('me') });

    const res = await request(app).get('/api/auth/me').set(authHeader(token));

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(user.id);
    expect(res.body.name).toBe('Me');
  });
});
