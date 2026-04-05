import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'mock@example.com',
    pass: process.env.EMAIL_PASS || 'mock-pass',
  },
});

export const sendExpirationEmail = async (email: string, subNumber: string, customerName: string) => {
  const mailOptions = {
    from: `"SubSaaS Ops" <${process.env.EMAIL_USER || 'no-reply@subsaas.com'}>`,
    to: email,
    subject: `Subscription Expired: ${subNumber}`,
    html: `
      <div style="font-family: 'Plus Jakarta Sans', sans-serif; max-width: 600px; margin: auto; padding: 40px; border: 1px solid #e2e8f0; border-radius: 24px; color: #0f172a;">
        <h2 style="font-weight: 900; letter-spacing: -0.04em; color: #f43f5e; font-size: 24px;">Lifecycle Update: Expired</h2>
        <p style="font-weight: 500; font-size: 16px; margin-top: 24px;">Hello <strong>${customerName}</strong>,</p>
        <p style="line-height: 1.6; color: #475569;">Your subscription <strong>${subNumber}</strong> has officially reached its lifecycle end date and is now <strong>Closed</strong>.</p>
        
        <div style="background: #f8fafc; padding: 20px; border-radius: 16px; margin-top: 32px;">
          <p style="font-[10px] font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em; margin: 0;">Subscription ID</p>
          <p style="font-weight: 900; font-size: 20px; margin: 4px 0 0 0;">${subNumber}</p>
        </div>

        <p style="margin-top: 40px; font-size: 14px; color: #64748b;">To resume your services or upgrade to a new plan, please visit your dashboard.</p>
        <div style="margin-top: 40px; border-top: 1px solid #f1f5f9; padding-top: 20px;">
          <p style="font-size: 12px; color: #cbd5e1; font-weight: 700; text-transform: uppercase;">SubSaaS Automated Platform</p>
        </div>
      </div>
    `,
  };

  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
       console.log('🔴 [AUTOMATION] Mock Email Sent (No SMTP Configured):', { to: email, sub: subNumber });
       return;
    }
    await transporter.sendMail(mailOptions);
    console.log(`🟢 [AUTOMATION] Expiration email dispatched to ${email}`);
  } catch (error) {
    console.error('🔴 [AUTOMATION] Failed to dispatch email:', error);
  }
};
