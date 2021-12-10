const bcrypt = require('bcrypt');

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