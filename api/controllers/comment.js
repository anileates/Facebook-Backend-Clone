const CustomError = require('../helpers/errorHelpers/CustomError');
const asyncErrorWrapper = require('express-async-handler');
const Comment = require('../models/Comment');
const Post = require('../models/Post');
const User = require('../models/User');
const errorsEnum = require('../helpers/errorHelpers/errorsEnum');
const mongoose = require('mongoose')

const getAllComments = asyncErrorWrapper(async (req, res, next) => {
    const post = req.data;

    return res.status(200).json({
        success: true,
        pagination: pagination,
        data: comments
    })

});

const getMoreComments = asyncErrorWrapper(async (req, res, next) => {
    //Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    const pagination = {};
    const post = await Post.findById(req.params.postId)
    const totalComment = post.comments.length;

    if (startIndex > 0) {
        pagination.previous = {
            page: page - 1,
            limit
        }
    }

    if (endIndex < totalComment) {
        pagination.next = {
            page: page + 1,
            limit
        }
    }

    let comments = await Post.findById(req.params.postId).select('-_id comments')
        .where('comments').slice(startIndex, limit)
        .populate('comments')
        .select('profile_image cover_image firstName lastName')

    let result = comments.comments

    return res.status(200).json({
        success: true,
        CustomElementRegistry: result
    })
});

const makeComment = asyncErrorWrapper(async (req, res, next) => {
    const loggedUser = req.loggedUser;

    if (req.body.content.trim() === '') {
        return next(new CustomError(errorsEnum.INVALID_CONTENT, 400));
    }

    const session = await mongoose.startSession()
    try {
        session.startTransaction()

        const post = await Post.findById(req.params.postId);
        const comment = await Comment.create({
            userId: loggedUser.id,
            postId: post.id,
            content: req.body.content
        });

        post.comments.push(comment.id);
        post.commentCount = post.comments.length;
        await post.save();

        await session.commitTransaction()
        return res.status(200).json({
            success: true,
            comment
        });
    } catch (error) {
        await session.abortTransaction()

        next(new CustomError(errorsEnum.INTERNAL_ERROR, 500))
    }
});

const editComment = asyncErrorWrapper(async (req, res, next) => {
    const comment = await Comment.findById(req.params.commentId);
    const newContent = req.body.content || req.body.newContent;

    comment.content = newContent;
    await comment.save();

    return res.status(200).json({
        success: true,
        comment: comment
    });
});

const deleteComment = asyncErrorWrapper(async (req, res, next) => {
    const { commentId } = req.params;

    await Comment.findByIdAndDelete(commentId);

    return res.status(200).json({
        success: true,
        message: "Comment succesfully deleted."
    });
});

const likeAComment = asyncErrorWrapper(async (req, res, next) => {
    const comment = await Comment.findById(req.params.commentId);
    const loggedUser = req.loggedUser;

    if (comment.likes.includes(loggedUser.id)) {
        return res.sendStatus(200)
    }

    comment.likes.push(loggedUser.id);
    comment.likeCount = comment.likes.length;

    await comment.save();

    return res.status(200).json({
        success: true,
        message: "Comment liked."
    });
});

const undoLikeAComment = asyncErrorWrapper(async (req, res, next) => {
    const comment = await Comment.findById(req.params.commentId);;
    const loggedUser = req.loggedUser;

    if (!comment.likes.includes(loggedUser.id)) {
        return next(new CustomError("You are already unliked this comment", 400));
    }

    comment.likes.splice(comment.likes.indexOf(loggedUser.id), 1);
    comment.likeCount = comment.likes.length;

    await comment.save();

    return res.status(200).json({
        success: true,
        message: "Comment unliked."
    });
});

module.exports = {
    getAllComments,
    makeComment,
    editComment,
    deleteComment,
    likeAComment,
    undoLikeAComment,
    getMoreComments
};