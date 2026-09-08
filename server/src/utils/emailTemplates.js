function wrap(title, bodyHtml) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #1c1917;">
      <h2 style="color: #4f46e5; margin-bottom: 16px;">${title}</h2>
      ${bodyHtml}
      <p style="margin-top: 32px; font-size: 12px; color: #8a8580;">Miracle Groupe</p>
    </div>
  `;
}

export function purchaseDecisionEmail({ studentName, courseTitle, status, adminNote }) {
  const approved = status === 'paid';
  const body = `
    <p>Hi ${studentName},</p>
    <p>
      Your purchase request for <strong>${courseTitle}</strong> has been
      ${approved ? '<strong style="color:#15803d;">approved</strong> - you now have full access to the course.' : '<strong style="color:#be123c;">declined</strong>.'}
    </p>
    ${adminNote ? `<p>Note from our team: ${adminNote}</p>` : ''}
  `;
  return {
    subject: approved ? `Your purchase of "${courseTitle}" is confirmed` : `Update on your "${courseTitle}" purchase request`,
    html: wrap('Purchase update', body),
  };
}

export function bookingDecisionEmail({ requesterName, classroomName, status, startTime, endTime, adminNote }) {
  const approved = status === 'approved';
  const body = `
    <p>Hi ${requesterName},</p>
    <p>
      Your booking request for <strong>${classroomName}</strong>
      (${new Date(startTime).toLocaleString()} &rarr; ${new Date(endTime).toLocaleString()}) has been
      ${approved ? '<strong style="color:#15803d;">approved</strong>.' : '<strong style="color:#be123c;">declined</strong>.'}
    </p>
    ${adminNote ? `<p>Note from our team: ${adminNote}</p>` : ''}
  `;
  return {
    subject: approved ? `Your classroom booking is confirmed` : `Update on your classroom booking request`,
    html: wrap('Classroom booking update', body),
  };
}

export function sessionRegistrationEmail({ studentName, sessionTitle, scheduledAt, type, discordInviteUrl, location }) {
  const when = new Date(scheduledAt).toLocaleString();
  const body = `
    <p>Hi ${studentName},</p>
    <p>You're registered for <strong>${sessionTitle}</strong> on ${when}.</p>
    ${
      type === 'live'
        ? `<p>Join the call: <a href="${discordInviteUrl}">${discordInviteUrl}</a></p>`
        : `<p>Location: ${location}</p>`
    }
  `;
  return {
    subject: `You're registered: ${sessionTitle}`,
    html: wrap('Session registration confirmed', body),
  };
}

export function certificateEarnedEmail({ studentName, courseTitle, certificateUrl }) {
  const body = `
    <p>Hi ${studentName},</p>
    <p>Congratulations - you've completed <strong>${courseTitle}</strong>!</p>
    <p><a href="${certificateUrl}">View and download your certificate</a></p>
  `;
  return {
    subject: `You earned a certificate for ${courseTitle}`,
    html: wrap('Certificate earned', body),
  };
}
