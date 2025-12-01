import nodemailer from 'nodemailer';

// Create reusable transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
    service: 'gmail', // Use Gmail or configure your own SMTP
    auth: {
        user: process.env.EMAIL_USER, // Your email
        pass: process.env.EMAIL_PASS  // Your app password
    }
});

export const sendOtpEmail = async (email, otp) => {
    try {
        // If credentials are not set, just log the OTP (for development)
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.log('=================================================');
            console.log(`[DEV MODE] OTP for ${email}: ${otp}`);
            console.log('=================================================');
            return true;
        }

        const mailOptions = {
            from: `"Mahal Booking" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Your Verification Code',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                    <h2 style="color: #4f46e5;">Verify your email</h2>
                    <p>Your verification code for Mahal Booking is:</p>
                    <h1 style="font-size: 32px; letter-spacing: 5px; color: #4f46e5; background: #f3f4f6; padding: 10px; display: inline-block; border-radius: 8px;">${otp}</h1>
                    <p>This code will expire in 5 minutes.</p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log(`OTP sent to ${email}`);
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        return false;
    }
};
