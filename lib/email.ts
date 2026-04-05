import nodemailer from 'nodemailer';

// Create reusable transporter
function createTransporter() {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  if (!emailUser || !emailPass) {
    console.warn('[Email] EMAIL_USER or EMAIL_PASS not set. OTP will be logged to console only.');
    return null;
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: emailUser,
      pass: emailPass,
    },
  });
}

export async function sendOtpEmail(to: string, otp: string, userName?: string): Promise<boolean> {
  const transporter = createTransporter();

  // Always log to console for debugging
  console.log(`[OTP] Code for ${to}: ${otp}`);

  if (!transporter) {
    return false;
  }

  try {
    await transporter.sendMail({
      from: `"SubSaaS Security" <${process.env.EMAIL_USER}>`,
      to,
      subject: '🔐 Your SubSaaS Password Reset Code',
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 480px; margin: 0 auto; padding: 0;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 32px 24px; border-radius: 16px 16px 0 0; text-align: center;">
            <div style="display: inline-block; background: rgba(255,255,255,0.2); border-radius: 12px; padding: 10px 14px; margin-bottom: 16px;">
              <span style="font-size: 24px; color: white; font-weight: bold;">⚡ SubSaaS</span>
            </div>
            <h1 style="color: white; margin: 0; font-size: 22px; font-weight: 600;">Password Reset</h1>
            <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0; font-size: 14px;">Secure verification code</p>
          </div>
          
          <!-- Body -->
          <div style="background: #ffffff; padding: 32px 24px; border: 1px solid #e5e7eb; border-top: none;">
            <p style="color: #374151; font-size: 15px; margin: 0 0 8px;">Hi${userName ? ' ' + userName : ''},</p>
            <p style="color: #6b7280; font-size: 14px; margin: 0 0 24px; line-height: 1.5;">
              We received a request to reset your password. Use the verification code below to proceed:
            </p>
            
            <!-- OTP Code Box -->
            <div style="background: linear-gradient(135deg, #f0f0ff, #f5f3ff); border: 2px dashed #6366f1; border-radius: 12px; padding: 24px; text-align: center; margin: 0 0 24px;">
              <p style="color: #6b7280; font-size: 12px; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 2px; font-weight: 600;">Your OTP Code</p>
              <div style="font-size: 36px; font-weight: 800; letter-spacing: 12px; color: #6366f1; font-family: 'Courier New', monospace;">
                ${otp}
              </div>
            </div>
            
            <!-- Timer warning -->
            <div style="background: #fef3c7; border-radius: 8px; padding: 12px 16px; margin: 0 0 24px;">
              <p style="color: #92400e; font-size: 13px; margin: 0;">
                ⏱️ This code expires in <strong>5 minutes</strong>. Do not share it with anyone.
              </p>
            </div>
            
            <p style="color: #9ca3af; font-size: 12px; margin: 0; line-height: 1.5;">
              If you didn't request this, please ignore this email or contact support if you have concerns.
            </p>
          </div>
          
          <!-- Footer -->
          <div style="background: #f9fafb; padding: 20px 24px; border-radius: 0 0 16px 16px; border: 1px solid #e5e7eb; border-top: none; text-align: center;">
            <p style="color: #9ca3af; font-size: 11px; margin: 0;">
              © ${new Date().getFullYear()} SubSaaS — AI-Powered Subscription Management
            </p>
          </div>
        </div>
      `,
    });
    console.log(`[Email] OTP sent to ${to}`);
    return true;
  } catch (error) {
    console.error('[Email] Failed to send:', error);
    return false;
  }
}
