import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { registerUser, uniqueEmail, authHeader } from './helpers.js';

function courseWithQuizAndExam() {
  return {
    title: 'Quiz + Exam Course',
    description: 'desc',
    category: 'General',
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
              questions: [{ questionText: '1 + 1?', options: ['1', '2'], correctOptionIndex: 1 }],
            },
          },
        ],
      },
    ],
    finalExam: {
      passingScore: 70,
      questions: [{ questionText: '3 + 3?', options: ['5', '6'], correctOptionIndex: 1 }],
    },
  };
}

async function setUpEnrolledStudent() {
  const { token: instructorToken } = await registerUser({ email: uniqueEmail('instructor'), role: 'instructor' });
  const created = await request(app)
    .post('/api/courses')
    .set(authHeader(instructorToken))
    .send(courseWithQuizAndExam());
  await request(app).put(`/api/courses/${created.body._id}`).set(authHeader(instructorToken)).send({ published: true });
  const course = created.body;

  const { token: studentToken } = await registerUser({ email: uniqueEmail('student') });
  await request(app).post('/api/enrollments').set(authHeader(studentToken)).send({ courseId: course._id });

  return { course, studentToken };
}

describe('lesson quiz grading', () => {
  it('grades a passing attempt and auto-completes the lesson', async () => {
    const { course, studentToken } = await setUpEnrolledStudent();
    const lessonId = course.sections[0].lessons[0]._id;

    const res = await request(app)
      .post(`/api/quizzes/${course._id}/lessons/${lessonId}/attempts`)
      .set(authHeader(studentToken))
      .send({ answers: [1] });

    expect(res.status).toBe(201);
    expect(res.body.passed).toBe(true);
    expect(res.body.score).toBe(100);
    expect(res.body.completedLessons).toHaveLength(1);
  });

  it('grades a failing attempt without completing the lesson', async () => {
    const { course, studentToken } = await setUpEnrolledStudent();
    const lessonId = course.sections[0].lessons[0]._id;

    const res = await request(app)
      .post(`/api/quizzes/${course._id}/lessons/${lessonId}/attempts`)
      .set(authHeader(studentToken))
      .send({ answers: [0] });

    expect(res.status).toBe(201);
    expect(res.body.passed).toBe(false);
    expect(res.body.completedLessons).toHaveLength(0);
  });

  it('rejects an attempt from a student who is not enrolled', async () => {
    const { course } = await setUpEnrolledStudent();
    const { token: outsiderToken } = await registerUser({ email: uniqueEmail('outsider') });
    const lessonId = course.sections[0].lessons[0]._id;

    const res = await request(app)
      .post(`/api/quizzes/${course._id}/lessons/${lessonId}/attempts`)
      .set(authHeader(outsiderToken))
      .send({ answers: [1] });

    expect(res.status).toBe(403);
  });

  it('rejects an answer array of the wrong length', async () => {
    const { course, studentToken } = await setUpEnrolledStudent();
    const lessonId = course.sections[0].lessons[0]._id;

    const res = await request(app)
      .post(`/api/quizzes/${course._id}/lessons/${lessonId}/attempts`)
      .set(authHeader(studentToken))
      .send({ answers: [] });

    expect(res.status).toBe(400);
  });
});

describe('final exam grading', () => {
  it('requires the lesson quiz to be passed before the course counts as completed', async () => {
    const { course, studentToken } = await setUpEnrolledStudent();

    const examRes = await request(app)
      .post(`/api/courses/${course._id}/final-exam/attempts`)
      .set(authHeader(studentToken))
      .send({ answers: [1] });

    expect(examRes.status).toBe(201);
    expect(examRes.body.passed).toBe(true);

    // The lesson quiz was never passed, so the enrollment itself isn't complete yet -
    // certificate eligibility requires both the exam pass AND full lesson completion.
    const certRes = await request(app)
      .get(`/api/enrollments/course/${course._id}/certificate`)
      .set(authHeader(studentToken));
    expect(certRes.status).toBe(403);
  });

  it('grants the certificate once both the lessons and the final exam are passed', async () => {
    const { course, studentToken } = await setUpEnrolledStudent();
    const lessonId = course.sections[0].lessons[0]._id;

    await request(app)
      .post(`/api/quizzes/${course._id}/lessons/${lessonId}/attempts`)
      .set(authHeader(studentToken))
      .send({ answers: [1] });

    await request(app)
      .post(`/api/courses/${course._id}/final-exam/attempts`)
      .set(authHeader(studentToken))
      .send({ answers: [1] });

    const certRes = await request(app)
      .get(`/api/enrollments/course/${course._id}/certificate`)
      .set(authHeader(studentToken));
    expect(certRes.status).toBe(200);
  });

  it('rejects a final exam attempt from a student who is not enrolled', async () => {
    const { course } = await setUpEnrolledStudent();
    const { token: outsiderToken } = await registerUser({ email: uniqueEmail('outsider2') });

    const res = await request(app)
      .post(`/api/courses/${course._id}/final-exam/attempts`)
      .set(authHeader(outsiderToken))
      .send({ answers: [1] });

    expect(res.status).toBe(403);
  });
});
