import { generateVerificationOtpEmailTemplate  } from "./emailTemplate.js";
import { sendEmail } from "./sendEmail.js";

export const sendVerificationCode = async (verificationCode, email, res) => {
    try {
        const message = generateVerificationOtpEmailTemplate (verificationCode);
        await sendEmail({
            email,
            subject: "Your Verification Code",
            message,
        });

        res.status(200).json({
            success: true,
            message: "Verification code sent successfully",
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Verification code failed to send",
        });
    }
};

export default sendVerificationCode;
