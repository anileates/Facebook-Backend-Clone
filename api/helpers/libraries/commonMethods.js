const sendMail = require('../libraries/sendEmail');
const CustomError = require('../errorHelpers/CustomError');

const sendAccountActivationMail =  async (user, res, next)  => {
    const activateAccToken = user.generateActivateAccountToken();
    await user.save();

    const activateAccURL = `http://localhost:5000/api/auth/activateAccount?activateAccountToken=${activateAccToken}`;

    const emailTemplate = `
    <h3>Click link to activate your account.</h3>
    <p><a href = '${activateAccURL}' target = '_blank'>Link</a></p>
    `;

    try {
        await sendMail({
            from: process.env.SMTP_EMAIL,
            to: user.email,
            subject: "Activate Your Fakebook Account",
            html: emailTemplate
        });

        return res.status(200).json({
            success: true,
            message: res.locals.message //mesaj içeriği, hesap yeni oluşturuldu ise farklı tekrar gönderiliyorsa farklı olacak.
        });
    }
    catch (err) {
        await user.save();

        return next(new CustomError("Email Could Not Be Sent.", 500));
    }   
};

module.exports = {
    sendAccountActivationMail
};
