/**
 * Basit bir Error sınıfıdır. Error Handler'ımıza hatalarımızı daha düzgün bir şekilde geçirebilmemiz için.
 */

class CustomError extends Error {
    constructor(message, status){
        super(message);
        this.status = status;
    }
}

module.exports = CustomError;