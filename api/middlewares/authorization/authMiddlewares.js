const { isTokenIncluded, getAccessTokenFromHeader } = require("../../helpers/authorizationHelpers/tokenHelpers");
const CustomError = require('../../helpers/errorHelpers/CustomError');
const jwt = require('jsonwebtoken');
const asyncErrorWrapper = require('express-async-handler');
const User = require('../../models/User');

/**
 * Bu metod, istek ile gelen access_token'ı kontrol eder. İçerisindeki veri ile kullanıcı kimliğini doğrularız ve bu kimlik loggedUser olarak tutulur.
 */
const getAccessToRoute = (req, res, next) => {
    const { JWT_SECRET_KEY } = process.env;
    if (!isTokenIncluded(req)) {
        return next(new CustomError("You are not authorized to access this route", 401));
    }

    const accessToken = getAccessTokenFromHeader(req);
    
    jwt.verify(accessToken, JWT_SECRET_KEY, async (err, decoded) => {
        if (err) {
            return next(new CustomError("You are not authorized to access this route", 401));
        }

        let user = await User.findById(decoded.id).select('sessionJwtTokens');
        if(!user.sessionJwtTokens.includes(accessToken)){
            return next(new CustomError("You are not authorized to access this route", 401));
        }

        req.loggedUser = {
            id: decoded.id,
            email: decoded.email
        };

        next();
    })
};

const getPostOwnerAccess = asyncErrorWrapper(async (req, res, next) => {
    const userId = req.loggedUser.id;
    const postOwnerId = req.data.userId;
  
    if(postOwnerId != userId){
        return next(new CustomError("Only owner can handle this operation.", 400));
    }

    next();
});

const getCommentOwnerAccess = asyncErrorWrapper(async (req, res, next) => {
    const userId = req.loggedUser.id;
    const commentOwnerId = req.comment.userId;

    if(commentOwnerId != userId){
        return next(new CustomError("Only owner can handle this operation.", 400));
    }

    next();
});

const deleteJwt = asyncErrorWrapper(async (req, res, next) => {
    const accessToken = getAccessTokenFromHeader(req);

    let user = await User.findById(req.loggedUser.id).select('sessionJwtTokens');
    let index = user.sessionJwtTokens.indexOf(accessToken);
    
    user.sessionJwtTokens.splice(index, 1);
    await user.save();
});

module.exports = {
    getAccessToRoute,
    getPostOwnerAccess,
    getCommentOwnerAccess,
    deleteJwt
};