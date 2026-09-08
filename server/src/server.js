import dotenv from 'dotenv';
// override: true ensures our .env always wins over ambient/injected env vars
// (e.g. a dev-tooling harness setting PORT for its own single-server assumption)
dotenv.config({ override: true });

import app from './app.js';
import { connectDB } from './config/db.js';

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    });
  } catch (err) {
    console.error(`Failed to start server: ${err.message}`);
    process.exit(1);
  }
}

start();

process.on('unhandledRejection', (err) => {
  console.error(`Unhandled rejection: ${err.message}`);
  process.exit(1);
});
