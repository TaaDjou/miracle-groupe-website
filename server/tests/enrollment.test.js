import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { registerUser, uniqueEmail, authHeader, createAdmin } from './helpers.js';

function twoLessonCoursePayload(overrides = {}) {
  return {
    title: 'Two Lesson Course',
    description: 'desc',
    category: 'General',
    level: 'beginner',
    price: 0,
    sections: [
      {
        title: 'Section 1',
        order: 0,
        lessons: [
          { title: 'Lesson 1', type: 'text', content: 'hello', order: 0 },
          { title: 'Lesson 2', type: 'text', content: 'world', order: 1 },
        ],
      },
    ],
    ...overrides,
  };
}

async function createPublishedCourse(instructorToken, overrides = {}) {
  const created = await request(app)
    .post('/api/courses')
    .set(authHeader(instructorToken))
    .send(twoLessonCoursePayload(overrides));
  await request(app).put(`/api/courses/${created.body._id}`).set(authHeader(instructorToken)).send({ published: true });
  const full = await request(app).get(`/api/courses/${created.body._id}`).set(authHeader(instructorToken));
  return full.body;
}

describe('enrollment', () => {
  it('lets a student enroll directly in a free course', async () => {
    const { token: instructorToken } = await registerUser({ email: uniqueEmail('instructor'), role: 'instructor' });
    const course = await createPublishedCourse(instructorToken);

    const { token: studentToken } = await registerUser({ email: uniqueEmail('student') });
    const res = await request(app).post('/api/enrollments').set(authHeader(studentToken)).send({ courseId: course._id });

    expect(res.status).toBe(201);
    expect(res.body.progress).toBe(0);
    expect(res.body.completed).toBe(false);
  });

  it('blocks direct enrollment in a paid course without an approved purchase', async () => {
    const { token: instructorToken } = await registerUser({ email: uniqueEmail('instructor'), role: 'instructor' });
    const course = await createPublishedCourse(instructorToken, { price: 49 });

    const { token: studentToken } = await registerUser({ email: uniqueEmail('student') });
    const res = await request(app).post('/api/enrollments').set(authHeader(studentToken)).send({ courseId: course._id });

    expect(res.status).toBe(403);
  });

  it('allows enrollment in a paid course once the purchase is approved', async () => {
    const { token: instructorToken } = await registerUser({ email: uniqueEmail('instructor'), role: 'instructor' });
    const course = await createPublishedCourse(instructorToken, { price: 49 });

    const { token: studentToken } = await registerUser({ email: uniqueEmail('student') });
    const purchase = await request(app)
      .post('/api/course-purchases')
      .set(authHeader(studentToken))
      .send({ courseId: course._id });
    expect(purchase.status).toBe(201);

    const stillBlocked = await request(app)
      .post('/api/enrollments')
      .set(authHeader(studentToken))
      .send({ courseId: course._id });
    expect(stillBlocked.status).toBe(403);

    const { token: adminToken } = await createAdmin();
    const decision = await request(app)
      .patch(`/api/course-purchases/${purchase.body._id}/status`)
      .set(authHeader(adminToken))
      .send({ status: 'paid' });
    expect(decision.status).toBe(200);

    // Approving the purchase auto-enrolls the student - confirm the enrollment now exists
    // rather than re-posting to /api/enrollments (which would 400 on an existing enrollment).
    const enrollmentRes = await request(app)
      .get(`/api/enrollments/course/${course._id}`)
      .set(authHeader(studentToken));
    expect(enrollmentRes.status).toBe(200);
  });

  it('rejects a second enrollment in the same course', async () => {
    const { token: instructorToken } = await registerUser({ email: uniqueEmail('instructor'), role: 'instructor' });
    const course = await createPublishedCourse(instructorToken);

    const { token: studentToken } = await registerUser({ email: uniqueEmail('student') });
    await request(app).post('/api/enrollments').set(authHeader(studentToken)).send({ courseId: course._id });
    const res = await request(app).post('/api/enrollments').set(authHeader(studentToken)).send({ courseId: course._id });

    expect(res.status).toBe(400);
  });

  it('tracks progress and marks the enrollment completed once all lessons are done', async () => {
    const { token: instructorToken } = await registerUser({ email: uniqueEmail('instructor'), role: 'instructor' });
    const course = await createPublishedCourse(instructorToken);

    const { token: studentToken } = await registerUser({ email: uniqueEmail('student') });
    await request(app).post('/api/enrollments').set(authHeader(studentToken)).send({ courseId: course._id });

    const [lesson1, lesson2] = course.sections[0].lessons;

    const afterFirst = await request(app)
      .patch(`/api/enrollments/${course._id}/lessons/${lesson1._id}/complete`)
      .set(authHeader(studentToken));
    expect(afterFirst.status).toBe(200);
    expect(afterFirst.body.progress).toBe(50);
    expect(afterFirst.body.completed).toBe(false);

    const afterSecond = await request(app)
      .patch(`/api/enrollments/${course._id}/lessons/${lesson2._id}/complete`)
      .set(authHeader(studentToken));
    expect(afterSecond.status).toBe(200);
    expect(afterSecond.body.progress).toBe(100);
    expect(afterSecond.body.completed).toBe(true);
  });

  it('makes the certificate available only after completion', async () => {
    const { token: instructorToken } = await registerUser({ email: uniqueEmail('instructor'), role: 'instructor' });
    const course = await createPublishedCourse(instructorToken);

    const { token: studentToken } = await registerUser({ email: uniqueEmail('student') });
    await request(app).post('/api/enrollments').set(authHeader(studentToken)).send({ courseId: course._id });

    const tooEarly = await request(app)
      .get(`/api/enrollments/course/${course._id}/certificate`)
      .set(authHeader(studentToken));
    expect(tooEarly.status).toBe(403);

    for (const lesson of course.sections[0].lessons) {
      await request(app)
        .patch(`/api/enrollments/${course._id}/lessons/${lesson._id}/complete`)
        .set(authHeader(studentToken));
    }

    const afterCompletion = await request(app)
      .get(`/api/enrollments/course/${course._id}/certificate`)
      .set(authHeader(studentToken));
    expect(afterCompletion.status).toBe(200);
    expect(afterCompletion.body.courseTitle).toBe(course.title);
  });
});
