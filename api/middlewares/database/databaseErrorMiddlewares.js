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
        return next(new CustomError(errorsEnum.USER_NOT_FOUND, 400));
    }

    next();
});

/**
 * İlgili gönderi db'de var mı diye bakar. Bunu bir çok routta kullanacağımız için bir middleware olarak yapılmıştır.
 */
const checkPostExist = asyncErrorWrapper(async (req, res, next) => {
    const postId = req.params.id || req.params.postId || req.params.post_id; // question_id veya id geldiyse onu al. Diger tarafta hepsini degistirmek yerine daha basit
    const post = await Post.findById(postId);

    if (!post) {
        return next(new CustomError("There is no such post with that id - " + postId, 400));
    }
    req.data = post;
    next();
});

const checkCommentExists = asyncErrorWrapper(async (req, res, next) => {
    const { commentId } = req.params;
    const postId = req.data.id;
    const comment = await Comment.findOne({ _id: commentId, postId: postId });

    if (!comment) {
        return next(new CustomError(`Comment Not Found with Comment Id : ${commentId} Associated With This Post`, 404));
    }

    req.comment = comment;
    next();
});

module.exports = {
    checkUserExist,
    checkPostExist,
    checkCommentExists
};