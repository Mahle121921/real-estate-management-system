const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const verifyEmailConnection = async () => {
    try {
        await transporter.verify();
        console.log("Email server connection successful");
    } catch (error) {
        console.error("Email server connection failed:", error.message);
    }
};

module.exports = {
    transporter,
    verifyEmailConnection
};