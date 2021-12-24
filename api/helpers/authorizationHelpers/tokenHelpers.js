const User = require('../../models/User');

const sendJwtToClient = async (user, res) => {
    const { NODE_ENV } = process.env;

    const token = user.generateJwtFromUser();
    await user.save();
    return res
        .status(200)
        .cookie('access_token', token, {
            httpOnly: true,
            secure: NODE_ENV === 'development' ? false : true // Marks the cookie to be used with HTTPS only. So, we can also use it in Development server
        })
        .json({
            success: true,
            access_token: token,
            data: {
                userId: user._id,
                name: user.firstName,
                email: user.email
            }
        });
};

// Checks if the authorization token is included in the header or not.
const isTokenIncluded = req => {
    return req.headers.authorization && req.headers.authorization.startsWith("Bearer:") || req.headers.authorization.startsWith("Bearer")
};

const getAccessTokenFromHeader = req => {
    const authorization = req.headers.authorization;

    const access_token = authorization.split(" ")[1];
    return access_token;
}


module.exports = {
    sendJwtToClient,
    isTokenIncluded,
    getAccessTokenFromHeader
};