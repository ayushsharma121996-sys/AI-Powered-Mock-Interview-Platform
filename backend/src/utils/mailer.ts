import nodemailer from 'nodemailer';

export async function sendResetEmail(email: string, name: string, token: string) {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || '"InterviewAI Support" <support@interviewai.local>';
  
  const resetLink = `http://localhost:5173/reset-password?token=${token}`;
  
  let transporter;
  let isTestAccount = false;

  if (host && user && pass) {
    // Production/Custom SMTP settings
    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // true for 465, false for other ports
      auth: {
        user,
        pass,
      },
    });
  } else {
    // Dynamic Ethereal Test Account creation
    console.log('⚠️ SMTP credentials not found in env variables. Generating ethereal.email test account...');
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      isTestAccount = true;
    } catch (err) {
      console.error('Failed to create Ethereal test account. Falling back to console-only mode:', err);
      // If Ethereal fails, we just print the link to the console and return
      console.log('\n======================================================');
      console.log(`🔑 [PASSWORD RESET MOCK LINK]`);
      console.log(`User: ${name} (${email})`);
      console.log(`Link: ${resetLink}`);
      console.log('======================================================\n');
      return { success: true, consoleOnly: true, link: resetLink };
    }
  }

  const mailOptions = {
    from,
    to: email,
    subject: 'InterviewAI - Password Reset Link',
    text: `Hello ${name},\n\nYou requested to reset your password. Please click the link below to set a new password:\n\n${resetLink}\n\nThis link is valid for 15 minutes.\n\nBest regards,\nInterviewAI Team`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
        <h2 style="color: #6366f1;">InterviewAI Password Reset</h2>
        <p>Hello <strong>${name}</strong>,</p>
        <p>You requested a password reset for your InterviewAI account. Click the button below to update your password:</p>
        <div style="margin: 24px 0;">
          <a href="${resetLink}" style="background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset Password</a>
        </div>
        <p style="font-size: 12px; color: #666;">If the button above does not work, copy and paste this URL into your browser:</p>
        <p style="font-size: 12px; color: #6366f1; word-break: break-all;">${resetLink}</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 11px; color: #999;">If you did not request this email, you can safely ignore it.</p>
      </div>
    `,
  };

  const info = await transporter.sendMail(mailOptions);
  
  if (isTestAccount) {
    console.log('\n======================================================');
    console.log(`🔑 [ETHEREAL RESET EMAIL SENT]`);
    console.log(`Message ID: ${info.messageId}`);
    console.log(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    console.log(`Link sent: ${resetLink}`);
    console.log('======================================================\n');
    return { success: true, testMessageUrl: nodemailer.getTestMessageUrl(info), link: resetLink };
  }

  console.log(`Reset email sent successfully to ${email}. Message ID: ${info.messageId}`);
  return { success: true, messageId: info.messageId, link: resetLink };
}
