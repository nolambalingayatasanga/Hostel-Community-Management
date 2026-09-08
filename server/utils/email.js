const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  const isEmailConfigured = 
    process.env.EMAIL_HOST &&
    process.env.EMAIL_USER &&
    process.env.EMAIL_PASSWORD;

  if (!isEmailConfigured) {
    console.log('\n==================================================');
    console.log('WARNING: Nodemailer SMTP settings are not configured.');
    console.log('Password reset request caught locally:');
    console.log(`To: ${options.email}`);
    console.log(`Subject: ${options.subject}`);
    console.log(`Message:\n${options.message}`);
    console.log('==================================================\n');
    return;
  }

  // Create transporter
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT || 2525,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });

  // Define email options
  const mailOptions = {
    from: `"Hostel Community" <no-reply@hostelcomm.org>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html || `<p>${options.message}</p>`
  };

  // Send the actual email
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
