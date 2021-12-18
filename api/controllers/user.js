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

    /** Check friendship status between two profiles. Because this info will be used on Front-end, like making 'Add friend or Unfriend' buttons */
    const mainUser = await User.findById(req.loggedUser.id);
    let friendshipStatus = checkFriendshipStatus(mainUser, req.data.id);

    res.status(200).json({
        success: true,
        data: user,
        friendshipStatus
    });
});

const addFriend = asyncErrorWrapper(async (req, res, next) => {
    const session = await mongoose.startSession()

    const reciever = await User.findById(req.params.userId, null, { session })
    const requester = await User.findById(req.loggedUser.id, null, { session });

    if (requester.id == reciever.id) {
        return next(new CustomError(errorsEnum.FRIEND_REQUEST, 400, 'Playful!'));
    }

    if (reciever.friends.includes(requester.id)) {
        return next(new CustomError(errorsEnum.FRIEND_REQUEST, 400, 'User is already a friend'));
    }

    if (reciever.pendingFriendRequests.includes(requester.id)) {
        return next(new CustomError(errorsEnum.FRIEND_REQUEST, 400, 'You already sent a frind request to this user.'));
    }

    if (requester.pendingFriendRequests.includes(reciever.id)) {
        return next(new CustomError(errorsEnum.FRIEND_REQUEST, 400, 'You have a friend request from this user. Accept that.'));
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

        return next(new CustomError(errorsEnum.INTERNAL_ERROR, 500))
    }

    session.endSession()
});

const acceptFriendRequest = asyncErrorWrapper(async (req, res, next) => {
    const session = await mongoose.startSession()

    const acceptingUser = await User.findById(req.loggedUser.id, null, { session });
    const sender = await User.findById(req.params.userId, null, { session })

    if (!acceptingUser.pendingFriendRequests.includes(sender.id)) {
        return next(new CustomError(errorsEnum.FRIEND_REQUEST, 400, 'There is no friend request from this user.'))
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

        next(new CustomError(errorsEnum.INTERNAL_ERROR, 500))
    }
    session.endSession()
    return
});

const unfriend = asyncErrorWrapper(async (req, res, next) => {
    const session = await mongoose.startSession()

    let loggedUser = await User.findById(req.loggedUser.id, null, { session });
    const userToUnfriend = await User.findById(req.params.userId, null, { session });

    if (!loggedUser.friends.includes(userToUnfriend.id)) {
        return next(new CustomError(errorsEnum.FRIEND_REQUEST, 400, 'User is not your friend'));
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

        next(new CustomError(errorsEnum.INTERNAL_ERROR, 500))
    }

    return session.endSession()
});

const searchUser = asyncErrorWrapper(async (req, res, next) => {
    let query = User.find();
    let users = [];

    if (req.query.search && req.query.search.trim() !== '') {
        const searchObject = [];

        const regex = new RegExp(req.query.search, "i"); //i, case sens. kapatır

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
    const userToRequest = req.data;
    const requestingUser = await User.findById(req.loggedUser.id);

    if (!userToRequest.pendingFriendRequests.includes(req.loggedUser.id)) {
        return next(new CustomError("You haven't sent request to this user or user accepted your request", 400));
    }

    userToRequest.pendingFriendRequests.splice(userToRequest.friends.indexOf(req.loggedUser.id), 1);
    await userToRequest.save();

    requestingUser.sentFriendRequests.splice(requestingUser.sentFriendRequests.indexOf(userToRequest.id), 1);
    await requestingUser.save();

    res.status(200).json({
        success: true,
        message: "Request succesfully cancelled"
    });
});

const denyRequest = asyncErrorWrapper(async (req, res, next) => {
    const requestingUser = req.data;
    const mainUser = await User.findById(req.loggedUser.id);

    if (!mainUser.pendingFriendRequests.includes(requestingUser.id)) {
        return next(new CustomError("There is no friend request from this user.", 400));
    }

    mainUser.pendingFriendRequests.splice(mainUser.pendingFriendRequests.indexOf(requestingUser.id), 1);
    await mainUser.save();

    requestingUser.sentFriendRequests.splice(requestingUser.sentFriendRequests.indexOf(req.loggedUser.id), 1);
    await requestingUser.save();

    res.status(200).json({
        success: true,
        message: "Request Denied"
    });
});

module.exports = {
    getUser,
    addFriend,
    acceptFriendRequest,
    unfriend,
    searchUser,
    cancelRequest,
    denyRequest
};