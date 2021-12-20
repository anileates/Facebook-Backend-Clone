/**
 * Make errors an object by this class
 * If specific message is given, the message property defined in @errorEnum is ignored 
 */

class CustomError extends Error {
    constructor(errorEnum, status, message, detail) {
        super(message || errorEnum.message);
        this.type = errorEnum.type;
        this.status = status;
        this.detail = detail
    }
}

module.exports = CustomError;