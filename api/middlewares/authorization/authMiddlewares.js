const { isTokenIncluded, getAccessTokenFromHeader } = require("../../helpers/authorizationHelpers/tokenHelpers");
const CustomError = require('../../helpers/errorHelpers/CustomError');
const jwt = require('jsonwebtoken');
const asyncErrorWrapper = require('express-async-handler');
const User = require('../../models/User');
const errorsEnum = require("../../helpers/errorHelpers/errorsEnum");
const Post = require("../../models/Post");

/**
 * This method verifies the given token by @JWT_SECRET_KEY.
 * If verification is valid then pass the @decodedUserInfos to the next via req.loggedUser
 */
const getAccessToRoute = (req, res, next) => {
    const { JWT_SECRET_KEY } = process.env;

    if (!isTokenIncluded(req)) {
        return next(new CustomError(errorsEnum.NOT_AUTHORIZED, 401, 'Make sure that the auth. token is included'));
    }

    const accessToken = getAccessTokenFromHeader(req);

    jwt.verify(accessToken, JWT_SECRET_KEY, async (err, decodedUserInfos) => {
        if (err) {
            return next(new CustomError(errorsEnum.NOT_AUTHORIZED, 401));
        }

        let user = await User.findById(decodedUserInfos.id).select('sessionTokens');
        if (!user.sessionTokens.includes(accessToken)) {
            return next(new CustomError(errorsEnum.NOT_AUTHORIZED, 401));
        }

        req.loggedUser = {
            id: decodedUserInfos.id,
            email: decodedUserInfos.email
        };

        next();
    })
};

const getPostOwnerAccess = asyncErrorWrapper(async (req, res, next) => {
    const userId = req.loggedUser.id;
    const post = await Post.findById(req.params.postId);

    if (post.userId != userId) {
        return next(new CustomError(errorsEnum.NOT_AUTHORIZED, 401));
    }

    next();
});

const getCommentOwnerAccess = asyncErrorWrapper(async (req, res, next) => {
    const userId = req.loggedUser.id;
    const commentOwnerId = await Comment.findById(req.params.commentId).select('userId').userId;

    if (commentOwnerId != userId) {
        return next(new CustomError(errorsEnum.NOT_AUTHORIZED, 401));
    }

    next();
});

/**
 * Find sessionToken after logout and delete that token
 */
const deleteJwt = asyncErrorWrapper(async (req, res, next) => {
    const accessToken = getAccessTokenFromHeader(req);

    let user = await User.findById(req.loggedUser.id).select('sessionTokens');
    let index = user.sessionTokens.indexOf(accessToken);

    user.sessionTokens.splice(index, 1);
    await user.save();
});

module.exports = {
    getAccessToRoute,
    getPostOwnerAccess,
    getCommentOwnerAccess,
    deleteJwt
};