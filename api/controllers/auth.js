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
        return next(new CustomError("Check your inputs", 400));
    }

    const user = await User.findOne({ email }).select('+password');

    //Compares hashed pw and users input by bcrypt
    if (!user || !comparePasswords(password, user.password)) {
        return next(new CustomError("Check Your Credentials", 400));
    }

    if (!user.enabled) {
        return next(new CustomError("Account is not activated. Please activate your account", 400));
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

    const user = await User.findOne({ email: email });

    if (!user) {
        return next(new CustomError("There is no user with that email - " + resetEmail), 400);
    }

    if (user.enabled) {
        return next(new CustomError("Account already activated.", 400));
    }

    res.locals.message = "Activation Mail resent";
    sendAccountActivationMail(user, res, next);
});

const forgotPassword = asyncErrorWrapper(async (req, res, next) => {
    const resetEmail = req.body.email;
    const user = await User.findOne({ email: resetEmail });

    if (!user) {
        return next(new CustomError("There is no user with that email - " + resetEmail), 400);
    }

    const resetPasswordToken = user.generateResetPasswordTokenFromUser();
    await user.save();

    const resetPasswordUrl = `http://localhost:5000/api/auth/resetPassword?resetPasswordToken=${resetPasswordToken}`;

    const emailTemplate = `
    <h3>Reset Your Password</h3>
    <p> This <a href = '${resetPasswordUrl}' target = '_blank'>link</a> will expire in 1 hour</p>
    `;

    try {
        await sendMail({
            from: process.env.SMTP_EMAIL,
            to: resetEmail,
            subject: "Reset Password Token",
            html: emailTemplate
        });

        return res.status(200)
            .json({
                success: true,
                message: "Email Sent",
            });
    }
    catch (err) {
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await user.save();

        return next(new CustomError("Email Could Not Be Sent", 500));
    }
});

const resetPassword = asyncErrorWrapper(async (req, res, next) => {
    const { resetPasswordToken } = req.query;
    const { newPassword, logoutEverywhere } = req.body;

    if (!resetPasswordToken) {
        return next(new CustomError("Please provide a valid token", 400));
    }

    let user = await User.findOne({
        resetPasswordToken: resetPasswordToken,
        resetPasswordExpire: { $gt: Date.now() } //gt= greater than sorgu
    });

    if (!user) {
        return next(new CustomError("Invalid token or token expired", 400));
    }

    if (logoutEverywhere) {
        user.sessionJwtTokens = [];
    }

    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    user.password = newPassword;

    await user.save();

    res.status(200).json({
        success: true,
        message: "Password changed successfully"
    });
});

const editPassword = asyncErrorWrapper(async (req, res, next) => {
    const { oldPassword, newPassword, logoutEverywhere } = req.body;

    if (!validateUserInputs(oldPassword, newPassword)) {
        return next(new CustomError("Check your inputs", 400));
    }

    let user = await User.findById(req.loggedUser.id).select('+password');

    if (!comparePasswords(oldPassword, user.password)) {
        return next(new CustomError("Current Password is not valid", 400));
    }

    if (logoutEverywhere) {
        user.sessionJwtTokens = [];
    }
    user.password = newPassword;
    await user.save();

    res.status(200).json({
        success: true,
        message: "Password changed succesfully"
    });
});

const sendChangeMailCode = asyncErrorWrapper(async (req, res, next) => {
    const { password, newEmail } = req.body;
    const user = await User.findById(req.loggedUser.id).select('+password');

    if (!(password && newEmail)) {
        return next(new CustomError("check your inputs", 400));
    }

    if (!comparePasswords(password, user.password)) {
        return next(new CustomError("Password is not valid", 400));
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
        return next(new CustomError("Email Could Not Be Sent", 500));
    }
});

const changeMailAddress = asyncErrorWrapper(async (req, res, next) => {
    const { newEmail, confirmationCode } = req.body;

    let ourUser = await User.findById(req.loggedUser.id);
    if (confirmationCode != ourUser.changeEmailCode) {
        return next(new CustomError('Confirmation code is not valid.', 403));
    }

    let user = await User.findOne({ email: newEmail });
    if (user) {
        return next(new CustomError("This e-mail adress already in use.", 400));
    }

    ourUser.email = newEmail;
    ourUser.changeEmailCode = undefined;
    await ourUser.save();

    res.status(200).json({
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
    sendChangeMailCode,
    changeMailAddress
};
