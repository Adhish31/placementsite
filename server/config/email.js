const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    // Basic setup - would normally use env variables
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.mailtrap.io',
        port: process.env.EMAIL_PORT || 2525,
        auth: {
            user: process.env.EMAIL_USER || 'mock_user',
            pass: process.env.EMAIL_PASS || 'mock_pass'
        }
    });

    const message = {
        from: `CareerQuest <no-reply@careerquest.io>`,
        to: options.email,
        subject: options.subject,
        text: options.message,
        html: options.html
    };

    const info = await transporter.sendMail(message);
    console.log('Message sent: %s', info.messageId);
};

module.exports = sendEmail;
