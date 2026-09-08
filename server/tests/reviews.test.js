import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { registerUser, uniqueEmail, authHeader } from './helpers.js';

async function createEnrolledStudent(course) {
  const { token: studentToken } = await registerUser({ email: uniqueEmail('student') });
  await request(app).post('/api/enrollments').set(authHeader(studentToken)).send({ courseId: course._id });
  return studentToken;
}

async function createPublishedFreeCourse() {
  const { token: instructorToken } = await registerUser({ email: uniqueEmail('instructor'), role: 'instructor' });
  const created = await request(app)
    .post('/api/courses')
    .set(authHeader(instructorToken))
    .send({ title: 'Reviewable Course', category: 'General', level: 'beginner', price: 0, sections: [] });
  await request(app).put(`/api/courses/${created.body._id}`).set(authHeader(instructorToken)).send({ published: true });
  return created.body;
}

describe('reviews', () => {
  it('rejects a review from a student who is not enrolled', async () => {
    const course = await createPublishedFreeCourse();
    const { token: studentToken } = await registerUser({ email: uniqueEmail('student') });

    const res = await request(app)
      .post('/api/reviews')
      .set(authHeader(studentToken))
      .send({ courseId: course._id, rating: 5, comment: 'Great!' });

    expect(res.status).toBe(403);
  });

  it('rejects a rating outside of 1-5', async () => {
    const course = await createPublishedFreeCourse();
    const studentToken = await createEnrolledStudent(course);

    const res = await request(app)
      .post('/api/reviews')
      .set(authHeader(studentToken))
      .send({ courseId: course._id, rating: 6 });

    expect(res.status).toBe(400);
  });

  it('lets an enrolled student submit a review', async () => {
    const course = await createPublishedFreeCourse();
    const studentToken = await createEnrolledStudent(course);

    const res = await request(app)
      .post('/api/reviews')
      .set(authHeader(studentToken))
      .send({ courseId: course._id, rating: 4, comment: 'Pretty good' });

    expect(res.status).toBe(201);
    expect(res.body.rating).toBe(4);
    expect(res.body.comment).toBe('Pretty good');
  });

  it('upserts rather than duplicating on a second submission from the same student', async () => {
    const course = await createPublishedFreeCourse();
    const studentToken = await createEnrolledStudent(course);

    await request(app).post('/api/reviews').set(authHeader(studentToken)).send({ courseId: course._id, rating: 3 });
    await request(app).post('/api/reviews').set(authHeader(studentToken)).send({ courseId: course._id, rating: 5 });

    const listRes = await request(app).get(`/api/reviews/course/${course._id}`);
    expect(listRes.body.count).toBe(1);
    expect(listRes.body.reviews[0].rating).toBe(5);
  });

  it('computes the average rating across multiple students', async () => {
    const course = await createPublishedFreeCourse();
    const studentA = await createEnrolledStudent(course);
    const studentB = await createEnrolledStudent(course);

    await request(app).post('/api/reviews').set(authHeader(studentA)).send({ courseId: course._id, rating: 4 });
    await request(app).post('/api/reviews').set(authHeader(studentB)).send({ courseId: course._id, rating: 2 });

    const listRes = await request(app).get(`/api/reviews/course/${course._id}`);
    expect(listRes.status).toBe(200);
    expect(listRes.body.count).toBe(2);
    expect(listRes.body.averageRating).toBe(3);
  });

  it('lets the review owner delete their review, but not other students', async () => {
    const course = await createPublishedFreeCourse();
    const studentToken = await createEnrolledStudent(course);
    const created = await request(app)
      .post('/api/reviews')
      .set(authHeader(studentToken))
      .send({ courseId: course._id, rating: 3 });

    const { token: otherToken } = await registerUser({ email: uniqueEmail('other') });
    const forbidden = await request(app).delete(`/api/reviews/${created.body._id}`).set(authHeader(otherToken));
    expect(forbidden.status).toBe(403);

    const allowed = await request(app).delete(`/api/reviews/${created.body._id}`).set(authHeader(studentToken));
    expect(allowed.status).toBe(200);
  });
});
