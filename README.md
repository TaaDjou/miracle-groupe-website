# Miracle Groupe Website

An e-learning platform. React (Vite) frontend, Express/MongoDB (Mongoose) backend.

## Features

- JWT auth with roles: `student`, `instructor`, `admin`
- Instructors build courses made of sections -> lessons (text, video, or quiz)
- Students enroll in published courses and track lesson-by-lesson progress
- Auto-graded quizzes; passing a quiz auto-completes its lesson

## Structure

```
client/   React + Vite frontend (SPA)
server/   Express API + Mongoose models
```

Key backend routes: `/api/auth`, `/api/courses`, `/api/enrollments`, `/api/quizzes`.

## Prerequisites

- Node.js 18+
- A running MongoDB instance (local install or MongoDB Atlas)

## Setup

```bash
npm run install:all
```

Copy the example env files and fill in real values:

```bash
cp client/.env.example client/.env
cp server/.env.example server/.env
```

`server/.env` needs a `JWT_SECRET` — generate one with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

## Development

Runs the Vite dev server and the Express API concurrently:

```bash
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api

Vite proxies `/api` requests to the backend during development, so the frontend can call relative paths without CORS issues.

## Production

```bash
npm run build   # builds the frontend into client/dist
npm start        # starts the Express server (serve client/dist separately or via a static host/CDN)
```
