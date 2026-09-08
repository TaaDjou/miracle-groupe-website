import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { registerUser, uniqueEmail, authHeader } from './helpers.js';

function sampleCoursePayload(overrides = {}) {
  return {
    title: 'Intro to Testing',
    description: 'Learn the basics',
    category: 'Software',
    level: 'beginner',
    price: 0,
    sections: [
      {
        title: 'Section 1',
        order: 0,
        lessons: [
          {
            title: 'Quiz lesson',
            type: 'quiz',
            order: 0,
            quiz: {
              passingScore: 70,
              questions: [
                { questionText: '2 + 2?', options: ['3', '4'], correctOptionIndex: 1 },
              ],
            },
          },
        ],
      },
    ],
    ...overrides,
  };
}

async function createInstructor() {
  return registerUser({ email: uniqueEmail('instructor'), role: 'instructor' });
}

describe('course CRUD + answer redaction', () => {
  it('rejects course creation from a student', async () => {
    const { token } = await registerUser({ email: uniqueEmail('student') });

    const res = await request(app).post('/api/courses').set(authHeader(token)).send(sampleCoursePayload());

    expect(res.status).toBe(403);
  });

  it('allows an instructor to create a course', async () => {
    const { token } = await createInstructor();

    const res = await request(app).post('/api/courses').set(authHeader(token)).send(sampleCoursePayload());

    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Intro to Testing');
    expect(res.body.published).toBe(false);
  });

  it('does not list unpublished courses in the public catalog', async () => {
    const { token } = await createInstructor();
    await request(app).post('/api/courses').set(authHeader(token)).send(sampleCoursePayload());

    const res = await request(app).get('/api/courses');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(0);
  });

  it('lists published courses without leaking quiz answers', async () => {
    const { token } = await createInstructor();
    const created = await request(app).post('/api/courses').set(authHeader(token)).send(sampleCoursePayload());
    await request(app).put(`/api/courses/${created.body._id}`).set(authHeader(token)).send({ published: true });

    const res = await request(app).get('/api/courses');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    const question = res.body[0].sections[0].lessons[0].quiz.questions[0];
    expect(question.correctOptionIndex).toBeUndefined();
    expect(question.questionText).toBe('2 + 2?');
  });

  it('hides the correct answer from a student fetching a published course by id', async () => {
    const { token: instructorToken } = await createInstructor();
    const created = await request(app)
      .post('/api/courses')
      .set(authHeader(instructorToken))
      .send(sampleCoursePayload());
    await request(app)
      .put(`/api/courses/${created.body._id}`)
      .set(authHeader(instructorToken))
      .send({ published: true });

    const { token: studentToken } = await registerUser({ email: uniqueEmail('viewer') });
    const res = await request(app)
      .get(`/api/courses/${created.body._id}`)
      .set(authHeader(studentToken));

    expect(res.status).toBe(200);
    expect(res.body.sections[0].lessons[0].quiz.questions[0].correctOptionIndex).toBeUndefined();
  });

  it('shows the correct answer to the owning instructor', async () => {
    const { token } = await createInstructor();
    const created = await request(app).post('/api/courses').set(authHeader(token)).send(sampleCoursePayload());

    const res = await request(app).get(`/api/courses/${created.body._id}`).set(authHeader(token));

    expect(res.status).toBe(200);
    expect(res.body.sections[0].lessons[0].quiz.questions[0].correctOptionIndex).toBe(1);
  });

  it('prevents a non-owning instructor from updating or deleting the course', async () => {
    const { token: ownerToken } = await createInstructor();
    const created = await request(app).post('/api/courses').set(authHeader(ownerToken)).send(sampleCoursePayload());

    const { token: otherToken } = await createInstructor();
    const updateRes = await request(app)
      .put(`/api/courses/${created.body._id}`)
      .set(authHeader(otherToken))
      .send({ title: 'Hijacked' });
    const deleteRes = await request(app).delete(`/api/courses/${created.body._id}`).set(authHeader(otherToken));

    expect(updateRes.status).toBe(403);
    expect(deleteRes.status).toBe(403);
  });

  it('filters the catalog by level and category', async () => {
    const { token } = await createInstructor();
    const a = await request(app)
      .post('/api/courses')
      .set(authHeader(token))
      .send(sampleCoursePayload({ title: 'Beginner Course', level: 'beginner', category: 'Art' }));
    const b = await request(app)
      .post('/api/courses')
      .set(authHeader(token))
      .send(sampleCoursePayload({ title: 'Advanced Course', level: 'advanced', category: 'Science' }));
    await request(app).put(`/api/courses/${a.body._id}`).set(authHeader(token)).send({ published: true });
    await request(app).put(`/api/courses/${b.body._id}`).set(authHeader(token)).send({ published: true });

    const res = await request(app).get('/api/courses').query({ level: 'advanced' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].title).toBe('Advanced Course');
  });
});
