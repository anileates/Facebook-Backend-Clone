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

    // const reciever = req.isUserExist;
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

        return next(new CustomError(errorsEnum.UNEXPECTED_SYNTAX, 500))
    }

    session.endSession()
});

const acceptFriendRequest = asyncErrorWrapper(async (req, res, next) => {
    const requestingUser = req.data;
    const { id } = req.loggedUser;

    let acceptingUser = await User.findById(id);

    if (acceptingUser.friends.includes(requestingUser.id)) {
        return next(new CustomError("User is already your friend", 400));
    }

    if (!acceptingUser.pendingFriendRequests.includes(requestingUser.id)) {
        return next(new CustomError("No such friend request", 400));
    }

    acceptingUser.pendingFriendRequests.splice(acceptingUser.pendingFriendRequests.indexOf(requestingUser.id), 1);
    acceptingUser.friends.push(requestingUser.id);
    await acceptingUser.save();

    requestingUser.friends.push(acceptingUser.id);
    requestingUser.sentFriendRequests.splice(requestingUser.sentFriendRequests.indexOf(acceptingUser.id), 1);

    try {
        await requestingUser.save();

        res.status(200).json({
            success: true,
            message: "Request Accepted Succesfully."
        });
    } catch (error) {
        acceptingUser.pendingFriendRequests.push(requestingUser.id);
        acceptingUser.friends.splice(acceptingUser.friends.indexOf(requestingUser.id), 1);

        await acceptingUser.save();

        return next(new CustomError("Sth went wrong. Try later.", 500));
    }
});

const unfriend = asyncErrorWrapper(async (req, res, next) => {
    const userToUnfriend = req.data;
    const loggedUserId = req.loggedUser.id;

    let loggedUser = await User.findById(loggedUserId);

    if (!loggedUser.friends.includes(userToUnfriend.id)) {
        return next(new CustomError("User is not your friend", 400));
    }

    loggedUser.friends.splice(loggedUser.friends.indexOf(userToUnfriend.id), 1);

    userToUnfriend.friends.splice(userToUnfriend.friends.indexOf(loggedUserId), 1);

    await loggedUser.save();

    try {
        await userToUnfriend.save();

        res.status(200).json({
            success: true,
            message: "User deleted from friend list"
        });
    } catch (error) {
        loggedUser.friends.push(userToUnfriend.id);
        await loggedUser.save();

        return next(new CustomError("Something went wrong"), 500);
    }
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