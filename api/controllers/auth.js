const User = require('../models/User');
const CustomError = require('../helpers/errorHelpers/CustomError');
const asyncErrorWrapper = require('express-async-handler');
const { sendJwtToClient } = require('../helpers/authorizationHelpers/tokenHelpers');
const { sendAccountActivationMail } = require('../helpers/libraries/commonMethods');
const { validateUserInputs, comparePasswords } = require('../helpers/inputHelpers');
const sendMail = require('../helpers/libraries/sendEmail');
const moment = require('moment');
const errorsEnum = require('../helpers/errorHelpers/errorsEnum')

const register = asyncErrorWrapper(async (req, res, next) => {
    const { firstName, lastName, birthday, gender, email, password } = req.body;

    //Check birthday format
    let isBirthdayValid = moment(birthday, ["YYYY-MM-DD", "YYYY/MM/DD", "YYYY.MM.DD"], true).isValid();
    if (!isBirthdayValid) {
        return next(
            new CustomError(errorsEnum.INVALID_DATE_FORMAT, 400,
                'Invalid date format. Birthday format must be YYYY-MM-DD',
            ));
    }

    const user = await User.create({
        firstName,
        lastName,
        birthday,
        gender,
        email,
        password
    });

    // Message content depends on whether acc. is created now or just email is wanted again. So, we need pass it by res
    res.message = "Signed Up Succesfully. Please activate your account.";

    sendAccountActivationMail(user, res, next);
});

const activateAccount = asyncErrorWrapper(async (req, res, next) => {
    const { accountActivationToken } = req.query;

    if (!accountActivationToken) {
        return next(new CustomError(errorsEnum.INVALID_ACTIVATION_TOKEN, 400));
    }

    let user = await User.findOne({ accountActivationToken });
    if (!user) {
        return next(new CustomError(errorsEnum.INVALID_ACTIVATION_TOKEN, 400));
    }

    user.enabled = true;
    await user.save();

    return res.send("Account succesfully activated")
});

const login = asyncErrorWrapper(async (req, res, next) => {
    const { email, password } = req.body;

    if (!validateUserInputs(email, password)) {
        return next(new CustomError(errorsEnum.INVALID_INPUTS, 400));
    }

    const user = await User.findOne({ email }).select('+password');

    //Compares hashed pw and user input by bcrypt
    if (!user || !comparePasswords(password, user.password)) {
        return next(new CustomError(errorsEnum.INVALID_INPUTS, 400));
    }

    if (!user.enabled) {
        return next(new CustomError(errorsEnum.ACCOUNT_NOT_ACTIVATED, 400));
    }

    sendJwtToClient(user, res);
});

const logout = asyncErrorWrapper(async (req, res, next) => {
    const { NODE_ENV } = process.env;

    res.status(200).cookie({
        httpOnly: true,
        expires: new Date(Date.now()),
        secure: NODE_ENV === 'development' ? false : true
    }).json({
        success: true,
        message: "Logout Succesfull"
    });

    return next();
});

const resendActivationMail = asyncErrorWrapper(async (req, res, next) => {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
        return next(new CustomError(errorsEnum.USER_NOT_FOUND, 400));
    }

    if (user.enabled) {
        return next(new CustomError(errorsEnum.ACCOUNT_ALREADY_ACTIVATED, 400));
    }

    res.locals.message = "Activation Mail resent";
    sendAccountActivationMail(user, res, next);
});

const forgotPassword = asyncErrorWrapper(async (req, res, next) => {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
        return next(new CustomError(errorsEnum.USER_NOT_FOUND, 400));
    }

    const resetPasswordToken = user.generateResetPasswordTokenFromUser();
    await user.save();

    const resetPasswordUrl = `${process.env.DOMAIN}${process.env.API_PATH}/auth/reset-password?resetPasswordToken=${resetPasswordToken}`;

    const emailTemplate = `
    <h3>Reset Your Password</h3>
    <p> This <a href = '${resetPasswordUrl}' target = '_blank'>link</a> will expire in 1 hour</p>
    `;

    try {
        await sendMail({
            from: process.env.SMTP_EMAIL,
            to: email,
            subject: "Reset Password Token",
            html: emailTemplate
        });

        return res.status(200)
            .json({
                success: true,
                message: "Email has been sent",
            });
    }
    catch (err) {
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await user.save();

        return next(new CustomError(errorsEnum.EMAIL_ERROR, 500));
    }
});

const resetPassword = asyncErrorWrapper(async (req, res, next) => {
    /**
     * @logoutEverywhere is a boolean that references if user wants to log out sessions or not
     */
    const { resetPasswordToken } = req.query;
    const { newPassword, logoutEverywhere } = req.body;

    if (!resetPasswordToken) {
        return next(new CustomError(errorsEnum.INVALID_INPUTS, 400));
    }

    let user = await User.findOne({
        resetPasswordToken: resetPasswordToken,
        resetPasswordExpire: { $gt: Date.now() } //gt = greater than
    });

    if (!user) {
        return next(new CustomError(errorsEnum.INVALID_TOKEN, 400));
    }

    if (logoutEverywhere) {
        user.sessionTokens = [];
    }

    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    user.password = newPassword;

    await user.save();

    res.status(200).json({
        success: true,
        message: "Password has been successfully changed."
    });
});

const editPassword = asyncErrorWrapper(async (req, res, next) => {
    /**
     * @logoutEverywhere is a boolean that references if user wants to log out sessions or not
     */
    const { oldPassword, newPassword, logoutEverywhere } = req.body;

    if (!validateUserInputs(oldPassword, newPassword)) {
        return next(new CustomError(errorsEnum.INVALID_INPUTS, 400));
    }

    let user = await User.findById(req.loggedUser.id).select('+password');

    if (!comparePasswords(oldPassword, user.password)) {
        return next(new CustomError(errorsEnum.INVALID_CURRENT_PASSWORD, 400));
    }

    if (logoutEverywhere) {
        user.sessionTokens = [];
    }
    user.password = newPassword;
    await user.save();

    res.status(200).json({
        success: true,
        message: "Password changed succesfully"
    });
});

const requestMailChange = asyncErrorWrapper(async (req, res, next) => {
    const { password, newEmail } = req.body;
    const user = await User.findById(req.loggedUser.id).select('+password');

    if (!(password && newEmail)) {
        return next(new CustomError(errorsEnum.INVALID_INPUTS, 400));
    }

    if (!comparePasswords(password, user.password)) {
        return next(new CustomError(errorsEnum.INVALID_INPUTS, 400));
    }

    const confirmationCode = user.generateChangeEmailCode();
    await user.save();

    const emailTemplate = `
    <h3>Your confirmation code</h3>
    <p> Use this code to change your email address: ${confirmationCode}</p>
    `;

    try {
        await sendMail({
            from: process.env.SMTP_EMAIL,
            to: newEmail,
            subject: "Confirmation Code",
            html: emailTemplate
        });

        res.status(200).json({
            success: true,
            message: "Confirmation Code has been sent"
        })
    }
    catch (err) {
        return next(new CustomError(errorsEnum.EMAIL_ERROR, 500));
    }
});

const changeMailAddress = asyncErrorWrapper(async (req, res, next) => {
    const { newEmail, confirmationCode } = req.body;

    let user = await User.findById(req.loggedUser.id);
    if (confirmationCode != user.changeEmailCode) {
        return next(new CustomError(errorsEnum.INVALIDE_CODE, 403));
    }

    const isAlreadyTaken = await User.exists({ email: newEmail });
    if (isAlreadyTaken) {
        return next(new CustomError(errorsEnum.EMAIL_IS_ALREADY_TAKEN, 400));
    }

    user.email = newEmail;
    user.changeEmailCode = undefined;
    await user.save();

    return res.status(200).json({
        success: true,
        message: "Mail address succesfully changed."
    });
});

module.exports = {
    register,
    login,
    activateAccount,
    logout,
    resendActivationMail,
    forgotPassword,
    resetPassword,
    editPassword,
    requestMailChange,
    changeMailAddress
};
