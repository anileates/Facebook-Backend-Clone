const CustomError = require('../../helpers/errorHelpers/CustomError');

/**
 * Bu sınıf sayesinde hatalarımızı kullanıcıya doha anlaşılır bir şekilde döndürmemiz için bir 'handler'dır.
 * 
 */
const customErrorHandler = (err, req, res, next) => {
    let customError = err;

    if(err.name === 'SyntaxError'){
        customError = new CustomError('Unexpected Syntax', 400);
    }
    if(err.name === 'ValidationError'){
        customError = new CustomError(err.message, 400);
    }
    if(err.code === 11000){
        customError = new CustomError('Duplicate Key Found: Check your input', 400);
    }
    
    if(err.name === 'CastError'){
        customError = new CustomError('Please provide a valid id', 400);
    }
    
    if(err.code == 'LIMIT_UNEXPECTED_FILE'){
        customError = new CustomError("You can not add more than 3 media.", 400);
    }
    
    res
    .status(customError.status || 500).json({
        success: false,
        message: customError.message
    });
};

module.exports = customErrorHandler;