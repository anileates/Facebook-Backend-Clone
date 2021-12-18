const CustomError = require('../../helpers/errorHelpers/CustomError');
const errorsEnum = require('../../helpers/errorHelpers/errorsEnum')

/**
 *  This middleware catchs unexpected errors and categorize them properly 
 */
const customErrorHandler = (err, req, res, next) => {
    let customError = err;
    console.log(err)

    if (err.name === 'SyntaxError') {
        customError = new CustomError(errorsEnum.UNEXPECTED_SYNTAX, 400);
    }

    if (err.name === 'ValidationError') {
        customError = new CustomError(errorsEnum.VALIDATION_ERROR, 400);
    }

    if (err.code === 11000) {
        customError = new CustomError(errorsEnum.DUPLICATE_KEY_FOUND, 400);
    }

    if (err.name === 'CastError') {
        customError = new CustomError(errorsEnum.CAST_ERROR, 400);
    }

    if (err.code == 'LIMIT_UNEXPECTED_FILE') {
        customError = new CustomError(errorsEnum.LIMIT_UNEXPECTED_FILE, 400);
    }

    res
        .status(customError.status || 500).json({
            type: customError.type,
            title: customError.message,
            detail: customError.detail
        });
};

module.exports = customErrorHandler;