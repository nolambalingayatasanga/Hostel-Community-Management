const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  const isEmailConfigured = 
    process.env.EMAIL_HOST &&
    process.env.EMAIL_USER &&
    process.env.EMAIL_PASSWORD;

  if (!isEmailConfigured) {
    console.log('\n==================================================');
    console.log('WARNING: Nodemailer SMTP settings are not configured.');
    console.log(`To: ${options.email}`);
    console.log(`Subject: ${options.subject}`);
    console.log(`Message:\n${options.message}`);
    console.log('==================================================\n');
    return;
  }

  const isGmail = (process.env.EMAIL_HOST || '').toLowerCase().includes('gmail');

  const transportConfig = isGmail
    ? {
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD
        }
      }
    : {
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT, 10) || 587,
        secure: parseInt(process.env.EMAIL_PORT, 10) === 465,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD
        }
      };

  const transporter = nodemailer.createTransport(transportConfig);

  const mailOptions = {
    from: `"Hostel Community" <${process.env.EMAIL_USER || 'no-reply@hostelcomm.org'}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html || `<p>${options.message}</p>`
  };

  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
