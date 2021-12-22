const User = require('../models/User');
const CustomError = require('../helpers/errorHelpers/CustomError');
const asyncErrorWrapper = require('express-async-handler');
const checkFriendshipStatus = require('../helpers/libraries/checkFriendshipStatus');
const { request } = require('express');
const errorsEnum = require('../helpers/errorHelpers/errorsEnum');
const mongoose = require('mongoose')

const getUser = asyncErrorWrapper(async (req, res, next) => {
    const { userId } = req.params.id

    const user = await User.findById(userId).select('_id firstName lastName birthday gender profile_image cover_image')

    /** Check friendship status between two profiles. This info will be used on Front-end, like making 'Add friend or Unfriend' buttons */
    const mainUser = await User.findById(req.loggedUser.id);
    let friendshipStatus = checkFriendshipStatus(mainUser, req.data.id);

    res.status(200).json({
        success: true,
        data: user,
        friendshipStatus
    });
});

const getUserPosts = asyncErrorWrapper(async (req, res, next) => {
    const userId = req.params.userId;

    //Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    const pagination = {};
    const user = await User.findById(userId);

    const totalPost = user.sharedPosts.length;

    if (startIndex > 0) {
        pagination.previous = {
            page: page - 1,
            limit: limit
        }
    }

    if (endIndex < totalPost) {
        pagination.next = {
            page: page + 1,
            limit: limit
        }
    }

    let posts = await User.find({ _id: userId }).select('-_id sharedPosts')
        .where('sharedPosts').slice(startIndex, limit)
        .populate({ path: 'sharedPosts', select: '-comments', populate: { path: 'userId', select: 'profile_image cover_image firstName lastName' } });

    let postsArrayObject = posts[0].sharedPosts.toObject();

    res.status(200).json({
        success: true,
        pagination: pagination,
        data: postsArrayObject
    });
});

const addFriend = asyncErrorWrapper(async (req, res, next) => {
    const session = await mongoose.startSession()

    const reciever = await User.findById(req.params.userId, null, { session })
    const requester = await User.findById(req.loggedUser.id, null, { session });

    if (requester.id == reciever.id) {
        return next(new CustomError(errorsEnum.FRIEND_REQUEST_ERROR, 400, 'Playful!'));
    }

    if (reciever.friends.includes(requester.id)) {
        return next(new CustomError(errorsEnum.FRIEND_REQUEST_ERROR, 400, 'User is already a friend'));
    }

    if (reciever.pendingFriendRequests.includes(requester.id)) {
        return next(new CustomError(errorsEnum.FRIEND_REQUEST_ERROR, 400, 'You already sent a frind request to this user.'));
    }

    if (requester.pendingFriendRequests.includes(reciever.id)) {
        return next(new CustomError(errorsEnum.FRIEND_REQUEST_ERROR, 400, 'You have a friend request from this user. Accept that.'));
    }

    try {
        session.startTransaction()

        reciever.pendingFriendRequests.push(requester.id);
        await reciever.save();

        requester.sentFriendRequests.push(reciever.id);
        await requester.save();

        await session.commitTransaction()
        res.status(200).json({
            success: true,
            message: "Friend request sent."
        });
    } catch (error) {
        await session.abortTransaction()

        next(new CustomError(errorsEnum.INTERNAL_ERROR, 500, error))
    }

    return session.endSession()
});

const acceptFriendRequest = asyncErrorWrapper(async (req, res, next) => {
    const session = await mongoose.startSession()

    const acceptingUser = await User.findById(req.loggedUser.id, null, { session });
    const sender = await User.findById(req.params.userId, null, { session })

    if (!acceptingUser.pendingFriendRequests.includes(sender.id)) {
        return next(new CustomError(errorsEnum.FRIEND_REQUEST_ERROR, 400, 'There is no friend request from this user.'))
    }

    try {
        session.startTransaction()

        acceptingUser.pendingFriendRequests.splice(acceptingUser.pendingFriendRequests.indexOf(sender.id), 1)
        acceptingUser.friends.push(sender.id);
        await acceptingUser.save();

        sender.sentFriendRequests.splice(sender.sentFriendRequests.indexOf(acceptingUser.id), 1)
        sender.friends.push(acceptingUser.id)
        await sender.save()

        await session.commitTransaction()
        res.status(200).json({
            success: true,
            message: 'Friend request accepted'
        })
    } catch (error) {
        await session.abortTransaction()

        next(new CustomError(errorsEnum.INTERNAL_ERROR, 500, error))
    }
    return session.endSession()
});

const unfriend = asyncErrorWrapper(async (req, res, next) => {
    const session = await mongoose.startSession()

    let loggedUser = await User.findById(req.loggedUser.id, null, { session });
    const userToUnfriend = await User.findById(req.params.userId, null, { session });

    if (!loggedUser.friends.includes(userToUnfriend.id)) {
        return next(new CustomError(errorsEnum.FRIEND_REQUEST_ERROR, 400, 'User is not your friend'));
    }

    try {
        session.startTransaction()

        loggedUser.friends.splice(loggedUser.friends.indexOf(userToUnfriend.id), 1);
        await loggedUser.save();

        userToUnfriend.friends.splice(userToUnfriend.friends.indexOf(loggedUser.id), 1);
        await userToUnfriend.save()

        await session.commitTransaction()
        res.status(200).json({
            success: true,
            message: 'User removed from friends.'
        })
    } catch (error) {
        await session.abortTransaction()

        next(new CustomError(errorsEnum.INTERNAL_ERROR, 500, error))
    }

    return session.endSession()
});

const searchUser = asyncErrorWrapper(async (req, res, next) => {
    let query = User.find();
    let users = [];

    if (req.query.search && req.query.search.trim() !== '') {
        const searchObject = [];

        const regex = new RegExp(req.query.search, "i"); //i, turn off case sensitivity

        searchObject.push({ firstName: regex })
        searchObject.push({ lastName: regex })

        query = query.where({ $or: searchObject }).select("firstName lastName profile_image");
        users = await query;
    }

    return res.status(200).json({
        success: true,
        data: users
    });
});

const cancelRequest = asyncErrorWrapper(async (req, res, next) => {
    const session = await mongoose.startSession()

    const canceller = await User.findById(req.loggedUser.id, null, { session });
    const userToCancel = await User.findById(req.params.userId, null, { session })

    if (!canceller.sentFriendRequests.includes(userToCancel.id)) {
        return next(new CustomError(errorsEnum.FRIEND_REQUEST_ERROR, 400, "You haven't sent request to this user or user accepted your request"));
    }

    try {
        session.startTransaction()

        userToCancel.pendingFriendRequests.splice(userToCancel.friends.indexOf(req.loggedUser.id), 1);
        await userToCancel.save();

        canceller.sentFriendRequests.splice(canceller.sentFriendRequests.indexOf(userToCancel.id), 1);
        await canceller.save();

        await session.commitTransaction()
        res.status(200).json({
            success: true,
            message: "Request succesfully cancelled"
        });
    } catch (error) {
        await session.abortTransaction()

        next(new CustomError(errorsEnum.INTERNAL_ERROR, 500, error))
    }

    return session.endSession()
});

const denyRequest = asyncErrorWrapper(async (req, res, next) => {
    const session = await mongoose.startSession()

    const refuser = await User.findById(req.loggedUser.id, null, { session });
    const refusedUser = await User.findById(req.params.userId, null, { session });

    if (!refuser.pendingFriendRequests.includes(refusedUser.id)) {
        return next(new CustomError(errorsEnum.FRIEND_REQUEST_ERROR, 400, "There is no friend request from this user."));
    }

    try {
        session.startTransaction()

        refuser.pendingFriendRequests.splice(refuser.pendingFriendRequests.indexOf(refusedUser.id), 1);
        await refuser.save();

        refusedUser.sentFriendRequests.splice(refusedUser.sentFriendRequests.indexOf(req.loggedUser.id), 1);
        await refusedUser.save();

        await session.commitTransaction()
        res.status(200).json({
            success: true,
            message: "Request Denied"
        });
    } catch (error) {
        await session.abortTransaction()

        next(new CustomError(errorsEnum.INTERNAL_ERROR, 500, error))
    }

    return session.endSession()
});

module.exports = {
    getUser,
    getUserPosts,
    addFriend,
    acceptFriendRequest,
    unfriend,
    searchUser,
    cancelRequest,
    denyRequest
};