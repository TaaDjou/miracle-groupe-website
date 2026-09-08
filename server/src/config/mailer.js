import nodemailer from 'nodemailer';

let transporterPromise = null;

// Lazily creates a Nodemailer transporter. If SMTP_HOST is configured, uses those
// real credentials. Otherwise auto-generates a free Ethereal test inbox so email
// sending works immediately with zero setup - swap in real SMTP env vars later
// with no code changes.
function createTransporter() {
  if (process.env.SMTP_HOST) {
    return Promise.resolve(
      nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: Number(process.env.SMTP_PORT) === 465,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      })
    );
  }

  return nodemailer.createTestAccount().then((account) => {
    console.log(`Using Ethereal test inbox for outgoing email (login: ${account.user})`);
    return nodemailer.createTransport({
      host: account.smtp.host,
      port: account.smtp.port,
      secure: account.smtp.secure,
      auth: {
        user: account.user,
        pass: account.pass,
      },
    });
  });
}

export function getTransporter() {
  if (!transporterPromise) {
    transporterPromise = createTransporter();
  }
  return transporterPromise;
}
