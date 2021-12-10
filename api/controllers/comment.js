const CustomError = require('../helpers/errorHelpers/CustomError');
const asyncErrorWrapper = require('express-async-handler');
const Comment = require('../models/Comment');
const Post = require('../models/Post');
const User = require('../models/User');

const getAllComments = asyncErrorWrapper(async (req, res, next) => {
    const post = req.data;

    return res.status(200).json({
        success: true,
        pagination: pagination,
        data: comments
    })
   
});

const getMoreComments = asyncErrorWrapper(async (req, res, next) => {
    const post = req.data;
    const totalComment = post.comments.length;
    //Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || totalComment;

    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    const pagination = {};

    if (startIndex > 0) {
        pagination.previous = {
            page: page - 1,
            limit: limit
        }
    }

    if (endIndex < totalComment) {
        pagination.next = {
            page: page + 1,
            limit: limit
        }
    }

    Post.populate(post, {path: "comments", populate: { path: "userId", select:"profile_image firstName lastName"}}, function(err, populatedPost){
        if(err){
            return next(new CustomError('Something went wrong. Try again later.', 500));
        }

        let comments = populatedPost.comments.splice(startIndex, limit);

        return res.status(200).json({
            success: true,
            pagination: pagination,
            data: comments
        })
    })
   
});

const makeComment = asyncErrorWrapper(async (req, res, next) => {
    const post = req.data;
    const loggedUser = req.loggedUser;
    
    if(req.body.content.trim() === ''){
        return next(new CustomError('Comment content can not be empty', 400));
    }

    const comment = await Comment.create({
        userId: loggedUser.id,
        postId: post.id,
        content: req.body.content
    });

    post.comments.push(comment.id);
    post.commentCount = post.comments.length;
    await post.save();

    return res.status(200).json({
        success: true,
        comment: comment
    });
});

const editComment = asyncErrorWrapper(async (req, res, next) => {
    const comment = req.comment;
    const newContent = req.body.content || req.body.newContent;

    comment.content = newContent;
    await comment.save();

    return res.status(200).json({
        success: true,
        comment: comment
    });
});

const deleteComment = asyncErrorWrapper(async (req, res, next) => {
    const {
        commentId
    } = req.params;

    await Comment.findByIdAndDelete(commentId);

    return res.status(200).json({
        success: true,
        message: "Comment succesfully deleted."
    });
});

const likeAComment = asyncErrorWrapper(async (req, res, next) => {
    const comment = req.comment;
    const loggedUser = req.loggedUser;

    if (comment.likes.includes(loggedUser.id)) {
        return next(new CustomError("You are already liked this comment", 400));
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
    const comment = req.comment;
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