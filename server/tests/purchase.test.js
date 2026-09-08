import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { registerUser, uniqueEmail, authHeader, createAdmin } from './helpers.js';

async function createPaidCourse(price = 99) {
  const { token: instructorToken } = await registerUser({ email: uniqueEmail('instructor'), role: 'instructor' });
  const created = await request(app)
    .post('/api/courses')
    .set(authHeader(instructorToken))
    .send({
      title: 'Paid Course',
      description: 'desc',
      category: 'General',
      level: 'beginner',
      price,
      sections: [],
    });
  await request(app).put(`/api/courses/${created.body._id}`).set(authHeader(instructorToken)).send({ published: true });
  return created.body;
}

describe('course purchase requests', () => {
  it('rejects a purchase request for a free course', async () => {
    const { token: instructorToken } = await registerUser({ email: uniqueEmail('instructor'), role: 'instructor' });
    const created = await request(app)
      .post('/api/courses')
      .set(authHeader(instructorToken))
      .send({ title: 'Free Course', category: 'General', level: 'beginner', price: 0, sections: [] });
    await request(app).put(`/api/courses/${created.body._id}`).set(authHeader(instructorToken)).send({ published: true });

    const { token: studentToken } = await registerUser({ email: uniqueEmail('student') });
    const res = await request(app)
      .post('/api/course-purchases')
      .set(authHeader(studentToken))
      .send({ courseId: created.body._id });

    expect(res.status).toBe(400);
  });

  it('creates a pending purchase request that only the requester can see in "mine"', async () => {
    const course = await createPaidCourse();
    const { token: studentToken } = await registerUser({ email: uniqueEmail('student') });

    const created = await request(app)
      .post('/api/course-purchases')
      .set(authHeader(studentToken))
      .send({ courseId: course._id });
    expect(created.status).toBe(201);
    expect(created.body.status).toBe('pending');
    expect(created.body.amount).toBe(course.price);

    const mine = await request(app).get('/api/course-purchases/mine').set(authHeader(studentToken));
    expect(mine.body).toHaveLength(1);
  });

  it('rejects a duplicate pending purchase request for the same course', async () => {
    const course = await createPaidCourse();
    const { token: studentToken } = await registerUser({ email: uniqueEmail('student') });
    await request(app).post('/api/course-purchases').set(authHeader(studentToken)).send({ courseId: course._id });

    const res = await request(app)
      .post('/api/course-purchases')
      .set(authHeader(studentToken))
      .send({ courseId: course._id });

    expect(res.status).toBe(400);
  });

  it('prevents a non-admin from listing or deciding on purchase requests', async () => {
    const course = await createPaidCourse();
    const { token: studentToken } = await registerUser({ email: uniqueEmail('student') });
    const purchase = await request(app)
      .post('/api/course-purchases')
      .set(authHeader(studentToken))
      .send({ courseId: course._id });

    const listRes = await request(app).get('/api/course-purchases').set(authHeader(studentToken));
    const decisionRes = await request(app)
      .patch(`/api/course-purchases/${purchase.body._id}/status`)
      .set(authHeader(studentToken))
      .send({ status: 'paid' });

    expect(listRes.status).toBe(403);
    expect(decisionRes.status).toBe(403);
  });

  it('auto-enrolls the student when an admin approves the purchase', async () => {
    const course = await createPaidCourse();
    const { token: studentToken, user: student } = await registerUser({ email: uniqueEmail('student') });
    const purchase = await request(app)
      .post('/api/course-purchases')
      .set(authHeader(studentToken))
      .send({ courseId: course._id });

    const { token: adminToken } = await createAdmin();
    const decision = await request(app)
      .patch(`/api/course-purchases/${purchase.body._id}/status`)
      .set(authHeader(adminToken))
      .send({ status: 'paid', adminNote: 'Payment confirmed' });

    expect(decision.status).toBe(200);
    expect(decision.body.status).toBe('paid');
    expect(decision.body.adminNote).toBe('Payment confirmed');

    const enrollmentRes = await request(app)
      .get(`/api/enrollments/course/${course._id}`)
      .set(authHeader(studentToken));
    expect(enrollmentRes.status).toBe(200);
    void student;
  });

  it('does not enroll the student when an admin rejects the purchase', async () => {
    const course = await createPaidCourse();
    const { token: studentToken } = await registerUser({ email: uniqueEmail('student') });
    const purchase = await request(app)
      .post('/api/course-purchases')
      .set(authHeader(studentToken))
      .send({ courseId: course._id });

    const { token: adminToken } = await createAdmin();
    const decision = await request(app)
      .patch(`/api/course-purchases/${purchase.body._id}/status`)
      .set(authHeader(adminToken))
      .send({ status: 'rejected' });
    expect(decision.status).toBe(200);

    const enrollmentRes = await request(app)
      .get(`/api/enrollments/course/${course._id}`)
      .set(authHeader(studentToken));
    expect(enrollmentRes.status).toBe(404);
  });
});
