import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { escapeHtml, validateEmail, validateText, verifyTurnstile } from '../../../lib/security';

export async function POST(req) {
  try {
    const rawBody = await req.text();
    let body = {};

    if (rawBody) {
      try {
        body = JSON.parse(rawBody);
      } catch (parseError) {
        return NextResponse.json(
          { success: false, message: 'Invalid request payload.' },
          { status: 400 }
        );
      }
    }

    const { fullName, email, message, honeypot, turnstileToken } = body;

    if (honeypot) {
      return NextResponse.json({ success: false, message: 'Unable to process this request.' }, { status: 400 });
    }

    if (!(await verifyTurnstile(turnstileToken, req))) {
      return NextResponse.json({ success: false, message: 'Security verification failed. Please try again.' }, { status: 403 });
    }

    if (!validateText(fullName, 100) || !validateEmail(email) || !validateText(message, 4000)) {
      return NextResponse.json(
        { success: false, message: 'Please check your form details and try again.' },
        { status: 400 }
      );
    }

    // Get SMTP config from environment
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = parseInt(process.env.SMTP_PORT, 10);
    const smtpSecure = process.env.SMTP_SECURE === 'true';
    const smtpUser = process.env.SMTP_USER || process.env.SMTP_FROM;
    const smtpPassword = process.env.SMTP_PASSWORD;
    const smtpTo = process.env.SMTP_TO;
    const smtpFrom = process.env.SMTP_FROM || smtpUser;

    if (!smtpUser || !smtpPassword) {
      console.error('SMTP credentials missing.');
      return NextResponse.json(
        { success: false, message: 'Email service is not configured properly.' },
        { status: 500 }
      );
    }

    // Configure nodemailer with webmail-compatible settings
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: {
        user: smtpUser,
        pass: smtpPassword,
      },
      tls: {
        rejectUnauthorized: false,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });

    // Email content
    const mailOptions = {
      from: `"Smart ePrint Services" <${smtpFrom}>`,
      to: smtpTo,
      replyTo: email,
      subject: `New Contact Form Submission from ${fullName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #024AD8, #0B63F6); padding: 20px; border-radius: 12px 12px 0 0;">
            <h2 style="color: #ffffff; margin: 0; font-size: 22px;">✉️ New Contact Form Submission</h2>
          </div>
          <div style="background-color: #ffffff; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0;">
                  <strong style="color: #374151;">Name:</strong>
                </td>
                <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: #111827;">
                  ${escapeHtml(fullName)}
                </td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0;">
                  <strong style="color: #374151;">Email:</strong>
                </td>
                <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: #111827;">
                  <a href="mailto:${escapeHtml(email)}" style="color: #024AD8;">${escapeHtml(email)}</a>
                </td>
              </tr>
            </table>
            <div style="margin-top: 16px;">
              <strong style="color: #374151;">Message:</strong>
              <p style="background-color: #f9fafb; padding: 15px; border-radius: 8px; color: #111827; margin-top: 8px; border: 1px solid #e5e7eb;">
                ${escapeHtml(message)}
              </p>
            </div>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
            <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
              This email was sent from the Smart ePrint Services website contact form.
            </p>
          </div>
        </div>
      `,
    };

    // Send email
    await transporter.sendMail(mailOptions);

    console.log('Contact form email sent successfully.');

    return NextResponse.json(
      { success: true, message: 'Message sent successfully!' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error sending contact form email:', error.message);
    console.error('Error code:', error.code);

    let userMessage = 'Failed to send message. Please try again later.';
    if (error.code === 'EAUTH') {
      userMessage = 'Email authentication failed. Please contact support.';
    } else if (error.code === 'ESOCKET' || error.code === 'ECONNECTION') {
      userMessage = 'Could not connect to the mail server. Please try again later.';
    }

    return NextResponse.json(
      { success: false, message: userMessage },
      { status: 500 }
    );
  }
}
