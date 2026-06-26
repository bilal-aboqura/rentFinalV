import nodemailer from 'nodemailer';

export interface SendMailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export async function sendMail(options: SendMailOptions) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
    port: parseInt(process.env.SMTP_PORT || '2525', 10),
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER || 'test_smtp_user',
      pass: process.env.SMTP_PASS || 'test_smtp_password',
    },
  });

  const mailOptions = {
    from: process.env.SMTP_FROM || 'noreply@airporttransfers.com',
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
  };

  return await transporter.sendMail(mailOptions);
}

export async function sendBookingConfirmationEmail(
  email: string,
  name: string,
  reference: string,
  pickupName: string,
  destinationName: string,
  date: string,
  time: string,
  price: number
) {
  const subject = `Booking Confirmation - Reference: ${reference}`;
  const text = `Dear ${name},

Thank you for your booking! Your reservation has been received and is currently Pending.

Booking Details:
- Reference: ${reference}
- Pickup: ${pickupName}
- Destination: ${destinationName}
- Date: ${date}
- Time: ${time}
- Price: $${price.toFixed(2)}

We will contact you shortly to confirm your booking.

Best regards,
Airport Transfer Team`;

  const html = `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
    <h2 style="color: #1e3a8a; margin-top: 0;">Booking Confirmation</h2>
    <p>Dear <strong>${name}</strong>,</p>
    <p>Thank you for your booking! Your reservation has been received and is currently <strong>Pending</strong>.</p>
    <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
    <h3 style="color: #1e3a8a;">Booking Details</h3>
    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="padding: 8px 0; color: #4a5568; width: 120px;"><strong>Reference:</strong></td>
        <td style="padding: 8px 0; color: #1a202c;">${reference}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #4a5568;"><strong>Pickup:</strong></td>
        <td style="padding: 8px 0; color: #1a202c;">${pickupName}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #4a5568;"><strong>Destination:</strong></td>
        <td style="padding: 8px 0; color: #1a202c;">${destinationName}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #4a5568;"><strong>Date:</strong></td>
        <td style="padding: 8px 0; color: #1a202c;">${date}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #4a5568;"><strong>Time:</strong></td>
        <td style="padding: 8px 0; color: #1a202c;">${time}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #4a5568;"><strong>Price:</strong></td>
        <td style="padding: 8px 0; color: #1a202c; font-size: 1.1em; font-weight: bold;">$${price.toFixed(2)}</td>
      </tr>
    </table>
    <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
    <p style="color: #4a5568;">We will contact you shortly to confirm your booking.</p>
    <p style="color: #4a5568; margin-top: 20px; border-top: 1px solid #edf2f7; padding-top: 10px;">Best regards,<br /><strong>Airport Transfer Team</strong></p>
  </div>`;

  try {
    return await sendMail({ to: email, subject, text, html });
  } catch (error) {
    console.error('Failed to send SMTP booking confirmation email:', error);
    // Graceful degradation: log the error but don't crash, allowing the reservation to be made
    return null;
  }
}

export async function sendAdminNotificationEmail(params: {
  reference: string;
  pickupName: string;
  destinationName: string;
  date: string;
  time: string;
  customerName: string;
  adminEmail: string;
}) {
  const { reference, pickupName, destinationName, date, time, customerName, adminEmail } = params;
  
  const subject = `New Booking Request - Ref: ${reference}`;
  
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const dashboardLink = `${appUrl}/admin/bookings?ref=${reference}`;

  const text = `A new booking request has been submitted by ${customerName}.

Booking Details:
- Reference: ${reference}
- Customer Name: ${customerName}
- Pickup: ${pickupName}
- Destination: ${destinationName}
- Date: ${date}
- Time: ${time}

You can view and manage this booking directly in the admin dashboard:
${dashboardLink}

Best regards,
System Automations`;

  const html = `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
    <h2 style="color: #b91c1c; margin-top: 0;">New Booking Request</h2>
    <p>A new booking request has been submitted by <strong>${customerName}</strong>.</p>
    <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
    <h3 style="color: #1e3a8a;">Booking Details</h3>
    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="padding: 8px 0; color: #4a5568; width: 120px;"><strong>Reference:</strong></td>
        <td style="padding: 8px 0; color: #1a202c;">${reference}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #4a5568;"><strong>Customer:</strong></td>
        <td style="padding: 8px 0; color: #1a202c;">${customerName}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #4a5568;"><strong>Pickup:</strong></td>
        <td style="padding: 8px 0; color: #1a202c;">${pickupName}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #4a5568;"><strong>Destination:</strong></td>
        <td style="padding: 8px 0; color: #1a202c;">${destinationName}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #4a5568;"><strong>Date:</strong></td>
        <td style="padding: 8px 0; color: #1a202c;">${date}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #4a5568;"><strong>Time:</strong></td>
        <td style="padding: 8px 0; color: #1a202c;">${time}</td>
      </tr>
    </table>
    <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
    <p style="margin-top: 20px;">
      <a href="${dashboardLink}" style="display: inline-block; background-color: #1e3a8a; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;">
        View Booking in Dashboard
      </a>
    </p>
    <p style="color: #718096; font-size: 0.85em; margin-top: 30px; border-top: 1px solid #edf2f7; padding-top: 10px;">
      This is an automated system notification.
    </p>
  </div>`;

  try {
    return await sendMail({ to: adminEmail, subject, text, html });
  } catch (error) {
    console.error('Failed to send SMTP admin booking notification email:', error);
    // Graceful degradation: log the error but don't crash the main flow
    return null;
  }
}

