const CustomError = require('../../helpers/errorHelpers/CustomError')
const asyncErrorWrapper = require('express-async-handler');
const User = require('../../models/User');
const Post = require('../../models/Post');
const Comment = require('../../models/Comment');
const errorsEnum = require('../../helpers/errorHelpers/errorsEnum');

/**
 * This middleware checks if the specified user is exist in DB or not.
 */
const checkUserExist = asyncErrorWrapper(async (req, res, next) => {
    const { userId } = req.params;

    const user = await User.exists({ _id: userId })
    if (!user) {
        return next(new CustomError(errorsEnum.USER_NOT_FOUND, 404));
    }

    next();
});

/**
 * This middleware checks if the specified post is exist in DB or not..
 */
const checkPostExist = asyncErrorWrapper(async (req, res, next) => {
    const postId = req.params.id || req.params.postId || req.params.post_id;

    const post = await Post.exists({ _id: postId });
    if (!post) {
        return next(new CustomError(errorsEnum.POST_NOT_FOUND, 404));
    }

    next();
});

/**
 * This middleware checks if the specified comment is exist in DB or not..
 */
const checkCommentExists = asyncErrorWrapper(async (req, res, next) => {
    const { commentId } = req.params;
    const postId = req.params.postId;

    const comment = await Comment.exists({ _id: commentId, postId: postId });
    if (!comment) {
        return next(new CustomError(errorsEnum.COMMENT_NOT_FOUND, 404));
    }

    next();
});

module.exports = {
    checkUserExist,
    checkPostExist,
    checkCommentExists
};