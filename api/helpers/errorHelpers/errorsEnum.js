/**
 * Made all errors a enum, so establish a standart about res types and messages.
 */

const errorsEnum = {
    INVALID_DATE_FORMAT: {
        type: 'validation/invalid-date-format',
        message: 'Date format is not valid'
    },
    UNEXPECTED_SYNTAX: {
        type: 'validation/unexpected-syntax',
        message: 'Unexpected syntax at given inputs'
    },
    DUPLICATE_KEY_FOUND: {
        type: 'db/duplicate-key-found',
        message: 'Duplicate input found'
    },
    VALIDATION_ERROR: {
        type: 'db/validation-error',
        message: 'Validation error found'
    },
    CAST_ERROR: {
        type: 'db/cast-error',
        message: 'Please provide a valid ID'
    },
    LIMIT_UNEXPECTED_FILE: {
        type: 'file/file-limit-exceeded',
        message: 'You can not add more than 3 media file.'
    }
}

module.exports = errorsEnum