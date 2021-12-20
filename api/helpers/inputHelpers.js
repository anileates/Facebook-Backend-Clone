const bcrypt = require('bcrypt');

// Checks whether credentials are empty or not
const validateUserInputs = (email, password) => {
    return email && password;
}

const comparePasswords = (password, hashedPassword) => {
    return bcrypt.compareSync(password, hashedPassword);
}

module.exports = {
    validateUserInputs,
    comparePasswords
};