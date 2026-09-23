import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { escapeHtml, validateEmail, validatePhone, validateText, verifyTurnstile } from '../../../lib/security';

const serviceOptions = new Set([
  'Printer Setup & Installation',
  'Printer Troubleshooting & Repair',
  'Computer Support',
  'Network & Wi-Fi Setup',
  'Smart Home Device Assistance',
  'Home Appliance Help',
  'Business Printing Solutions',
  'General Consultation',
]);

function buildEmailContent({ fullName, phone, email, serviceType, modelNumber, description }) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #023eb6, #0B63F6); padding: 20px; border-radius: 12px 12px 0 0;">
        <h2 style="color: #ffffff; margin: 0; font-size: 22px;">📋 New Appointment Request</h2>
      </div>
      <div style="background-color: #ffffff; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0;">
              <strong style="color: #374151;">Full Name:</strong>
            </td>
            <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: #111827;">
              ${escapeHtml(fullName)}
            </td>
          </tr>
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0;">
              <strong style="color: #374151;">Phone:</strong>
            </td>
            <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: #111827;">
              ${escapeHtml(phone)}
            </td>
          </tr>
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0;">
              <strong style="color: #374151;">Email:</strong>
            </td>
            <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: #111827;">
              <a href="mailto:${escapeHtml(email)}" style="color: #0337a0;">${escapeHtml(email)}</a>
            </td>
          </tr>
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0;">
              <strong style="color: #374151;">Service Type:</strong>
            </td>
            <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: #111827;">
              ${escapeHtml(serviceType)}
            </td>
          </tr>
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0;">
              <strong style="color: #374151;">Model Number:</strong>
            </td>
            <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: #111827;">
              ${escapeHtml(modelNumber)}
            </td>
          </tr>
        </table>
        <div style="margin-top: 16px;">
          <strong style="color: #374151;">Description:</strong>
          <p style="background-color: #f9fafb; padding: 15px; border-radius: 8px; color: #111827; margin-top: 8px; border: 1px solid #e5e7eb;">
            ${escapeHtml(description || 'No description provided.')}
          </p>
        </div>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
        <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
          This email was sent from the Smart ePrint Services website appointment form.
        </p>
      </div>
    </div>
  `;
}

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

    const { fullName, phone, email, serviceType, modelNumber, description, honeypot, turnstileToken } = body;

    if (honeypot) {
      return NextResponse.json({ success: false, message: 'Unable to process this request.' }, { status: 400 });
    }

    if (!(await verifyTurnstile(turnstileToken, req))) {
      return NextResponse.json({ success: false, message: 'Security verification failed. Please try again.' }, { status: 403 });
    }

    if (!validateText(fullName, 100) || !validatePhone(phone) || !validateEmail(email) || !validateText(serviceType, 80) || !serviceOptions.has(serviceType) || !validateText(modelNumber, 100) || (description && !validateText(description, 2000))) {
      return NextResponse.json(
        { success: false, message: 'Please enter a valid phone number and check your form details.' },
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
      console.error('SMTP credentials missing. SMTP_USER:', !!smtpUser, 'SMTP_PASSWORD:', !!smtpPassword);
      return NextResponse.json(
        { success: false, message: 'Email service is not configured properly.' },
        { status: 500 }
      );
    }

    console.log(`Attempting SMTP connection to ${smtpHost}:${smtpPort} (secure: ${smtpSecure})`);

    // Create transporter with webmail-compatible settings
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure, // true for port 465 (SSL), false for 587 (STARTTLS)
      auth: {
        user: smtpUser,
        pass: smtpPassword,
      },
      tls: {
        // Accept self-signed certificates (common with webmail/cPanel hosts)
        rejectUnauthorized: false,
      },
      connectionTimeout: 10000, // 10 seconds
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });

    // Send the email directly; some hosts reject verify() even when sendMail works.
    const info = await transporter.sendMail({
      from: `"Smart ePrint Services" <${smtpFrom}>`,
      to: smtpTo,
      replyTo: email,
      subject: `New Appointment Request from ${fullName}`,
      html: buildEmailContent({ fullName, phone, email, serviceType, modelNumber, description }),
    });

    console.log('Email sent successfully. Message ID:', info.messageId);

    return NextResponse.json(
      { success: true, message: 'Appointment request sent successfully! We will contact you shortly.' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error processing appointment email:', error.message);
    console.error('Error code:', error.code);
    console.error('Full error:', JSON.stringify(error, Object.getOwnPropertyNames(error)));

    // Provide user-friendly error messages based on error type
    let userMessage = 'Unable to send your request right now. Please try again later.';

    if (error.code === 'EAUTH') {
      userMessage = 'Email authentication failed. Please contact support.';
    } else if (error.code === 'ESOCKET' || error.code === 'ECONNECTION') {
      userMessage = 'Could not connect to the mail server. Please try again later.';
    } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED') {
      userMessage = 'Mail server is unreachable. Please try again later.';
    }

    return NextResponse.json(
      { success: false, message: userMessage },
      { status: 500 }
    );
  }
}
