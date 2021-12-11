const sendMail = require('../libraries/sendEmail');
const CustomError = require('../errorHelpers/CustomError');
const errorEnum = require('../errorHelpers/errorsEnum')

const sendAccountActivationMail =  async (user, res, next)  => {
    const accountActivationToken = user.generateteAccountActivationToken();
    await user.save();

    const activateAccURL = `${process.env.DOMAIN}${process.env.API_PATH}/auth/activate-account?accountActivationToken=${accountActivationToken}`;

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
            message: res.message 
        });
    }
    catch (err) {
        await user.save();

        return next(new CustomError(errorEnum.EMAIL_ERROR, 500));
    }   
};

module.exports = {
    sendAccountActivationMail
};
