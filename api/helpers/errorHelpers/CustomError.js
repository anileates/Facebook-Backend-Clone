/**
 * Make errors a object by this class
 * If specific message is given, the message property defined in @errorEnum is ignored 
 */

class CustomError extends Error {
    constructor(errorEnum, status, message) {
        super(message || errorEnum.message);
        this.type = errorEnum.type;
        this.status = status;
    }
}

module.exports = CustomError;