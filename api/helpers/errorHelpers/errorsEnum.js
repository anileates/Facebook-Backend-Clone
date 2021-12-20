/**
 * Made all errors a enum, so establish a standart about res types and messages.
 */

const errorsEnum = {
    INVALID_DATE_FORMAT: {
        type: 'invalid-date-format',
        message: 'Date format is not valid'
    },
    UNEXPECTED_SYNTAX: {
        type: 'unexpected-syntax',
        message: 'Unexpected syntax at given inputs'
    },
    DUPLICATE_KEY_FOUND: {
        type: 'duplicate-key-found',
        message: 'Duplicate input found'
    },
    VALIDATION_ERROR: {
        type: 'validation-error',
        message: 'Validation error found'
    },
    CAST_ERROR: {
        type: 'cast-error',
        message: 'Please provide a valid ID'
    },
    LIMIT_UNEXPECTED_FILE: {
        type: 'file-limit-exceeded',
        message: 'You can not add more than 3 media file.'
    },
    INVALID_ACTIVATION_TOKEN: {
        type: 'invalid-activation-token',
        message: 'Please provide a valid token.'
    },
    EMAIL_ERROR: {
        type: 'smtp-error',
        message: 'Couldn\'t send email. Try again later.'
    },
    USER_NOT_FOUND: {
        type: 'user-not-found',
        message: 'User not found with given information(s).'
    },
    ACCOUNT_ALREADY_ACTIVATED: {
        type: 'already-activated',
        message: 'Account already activated'
    },
    ACCOUNT_NOT_ACTIVATED: {
        type: 'account-not-activated',
        message: 'Account is not activated. Please activate your account.'
    },
    INVALID_INPUTS: {
        type: 'invalid-inputs',
        message: 'Check your inputs'
    },
    NOT_AUTHORIZED: {
        type: 'unauthorized-request',
        message: 'You are not authorized to access this route.'
    },
    INVALID_TOKEN: {
        type: 'invalid-token',
        message: 'Token is not valid or expired'
    },
    INVALID_CURRENT_PASSWORD: {
        type: 'invalid-current-password',
        message: 'Current Password is not valid'
    },
    EMAIL_IS_ALREADY_TAKEN: {
        type: 'email-already-taken',
        message: 'This e-mail adress already in use.'
    },
    INVALIDE_CODE: {
        type: 'invalid-code',
        message: 'Confirmation code is not valid.'
    },
    FORBIDDEN_FIELD: {
        type: 'forbidden-field',
        message: 'You are not allowed to change this property via this route.'
    },
    INVALID_MIME_TYPE: {
        type: 'invalid-mime-type',
        message: 'Provide a valid mime type. \nAllowed mime types: JPG, JPEG, GIF, PNG'
    },
    FRIEND_REQUEST_ERROR: {
        type: 'bad-friend-requst',
        message: 'Request could not be sent.'
    },
    INTERNAL_ERROR: {
        type: 'internal-error',
        message: 'Something went wrong'
    },
    POST_NOT_FOUND: {
        type: 'post-not-found',
        message: 'Post not found with given information(s).'
    },
    INVALID_CONTENT: {
        type: 'empty-content',
        message: 'Content body can not be empty.'
    },
    COMMENT_NOT_FOUND: {
        type: 'comment-not-found',
        message: 'Comment not found with given information(s).'
    }
}

module.exports = errorsEnum