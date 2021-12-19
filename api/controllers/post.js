const User = require('../models/User');
const Post = require('../models/Post');
const CustomError = require('../helpers/errorHelpers/CustomError');
const asyncErrorWrapper = require('express-async-handler');
const errorsEnum = require('../helpers/errorHelpers/errorsEnum');
const mongoose = require('mongoose')

const createPost = asyncErrorWrapper(async (req, res, next) => {
    const { content } = req.body;

    if (content.trim() === '') {
        return next(new CustomError(errorsEnum.INVALID_CONTENT, 400));
    }

    // Get filename to insert DB
    let medias = [];
    req.files.media.forEach(file => medias.push(file.filename))

    const session = await mongoose.startSession()
    try {
        session.startTransaction()

        const post = await Post.create({
            userId: req.loggedUser.id,
            content: content,
            media: medias
        }, { session });

        let user = await User.findById(req.loggedUser.id, null, { session });

        // Put this post to TOP OF user feeds and homepages 
        user.feed.unshift(post.id);
        user.sharedPosts.unshift(post.id);
        await user.save();

        // Send this post to user friends
        user.friends.forEach(async (friendId) => {
            let friend = await User.findById(friendId, null, { session });
            friend.feed.unshift(post.id);

            await friend.save();
        });

        await session.commitTransaction()
        return res.status(200).json({
            success: true,
            message: "Post succesfully created",
            post: post
        });
    } catch (error) {
        await session.abortTransaction()

        next(new CustomError(errorsEnum.INTERNAL_ERROR, 500))
    }

    return session.endSession()
});

const deletePost = asyncErrorWrapper(async (req, res, next) => {
    const post = req.data;

    let user = await User.findById(post.userId);
    user.homePageStatus.splice(user.homePageStatus.indexOf(post._id), 1);
    user.sharedPosts.splice(user.sharedPosts.indexOf(post._id), 1);

    user.friends.forEach(async (friendId) => {
        let friend = await User.findById(friendId);
        friend.homePageStatus.splice(friend.homePageStatus.indexOf(post._id), 1);

        await friend.save();
    });

    await post.remove();
    await user.save();

    res.status(200).json({
        succes: true,
        message: "Post successfully deleted"
    });
});

const editPost = asyncErrorWrapper(async (req, res, next) => {
    const post = req.data;
    post.content = req.body.newContent;

    let editedPost = await post.save();
    editedPost = editedPost.toObject();

    delete editedPost['comments']
    delete editedPost['likes']
    delete editedPost['__v']

    res.status(200).json({
        succes: true,
        message: "Post successfully edited",
        editedPost: editedPost
    });
});

const likePost = asyncErrorWrapper(async (req, res, next) => {
    const post = req.data;
    const user = req.loggedUser;

    if (post.likes.includes(user.id)) {
        return next(new CustomError("You already liked this post", 400));
    }

    post.likes.push(user.id);
    post.likeCount = post.likes.length;
    await post.save();

    res.status(200).json({
        succes: true,
        message: "Post liked"
    });
});

const undoLikePost = asyncErrorWrapper(async (req, res, next) => {
    const post = req.data;
    const user = req.loggedUser;

    if (!post.likes.includes(user.id)) {
        return next(new CustomError("You already did not like this post", 400));
    }

    const index = post.likes.indexOf(user.id);

    post.likes.splice(index, 1);
    post.likeCount = post.likes.length;
    await post.save();

    res.status(200).json({
        succes: true,
        message: "Unliked"
    });
});

const getSinglePost = asyncErrorWrapper(async (req, res, next) => {
    const post = req.params.postId;

    return res.status(200).json({
        succes: true,
        post: post
    });
});

module.exports = {
    createPost,
    deletePost,
    editPost,
    likePost,
    undoLikePost,
    getSinglePost
};