import nodemailer from 'nodemailer';
import { getTransporter } from '../config/mailer.js';

// Fire-and-forget: email delivery failures should never break the request that
// triggered them. Callers should not await this in a way that fails the response.
export async function sendEmail({ to, subject, html }) {
  try {
    const transporter = await getTransporter();
    const from = process.env.EMAIL_FROM || 'Miracle Groupe <no-reply@miraclegroupe.test>';

    const info = await transporter.sendMail({ from, to, subject, html });

    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`Email sent to ${to} - preview: ${previewUrl}`);
    } else {
      console.log(`Email sent to ${to}`);
    }
  } catch (err) {
    console.error(`Failed to send email to ${to}: ${err.message}`);
  }
}
