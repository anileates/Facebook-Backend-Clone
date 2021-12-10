const User = require('../models/User');
const CustomError = require('../helpers/errorHelpers/CustomError');
const asyncErrorWrapper = require('express-async-handler');
const checkFriendshipStatus = require('../helpers/libraries/checkFriendshipStatus');
const { request } = require('express');

const getUser = asyncErrorWrapper(async (req, res, next) => {
    const user = await User.find({ _id: req.data.id }, 'profile_image cover_image friends _id createdAt firstName lastName birthday gender')
        .populate({ path: 'friends', select: 'firstName lastName profile_image' });

    /** Burada arkaşlık durumunu kontrol ediyoruz ve dönüyoruz. Front'ta kullanılması için */
    const mainUser = await User.findById(req.loggedUser.id);
    
    let friendShipStatus = checkFriendshipStatus(mainUser, req.data.id);

    res.status(200).json({
        success: true,
        data: user,
        friendShipStatus
    });
});

const addFriend = asyncErrorWrapper(async (req, res, next) => {
    const userToRequest = req.data;
    const requestingUser = await User.findById(req.loggedUser.id);

    if (requestingUser.id == userToRequest.id) {
        return next(new CustomError("Playful!", 400));
    }

    if (userToRequest.friends.includes(requestingUser.id)) {
        return next(new CustomError("The user is already your friend.", 400));
    }

    if (userToRequest.pendingFriendRequests.includes(requestingUser.id)) {
        return next(new CustomError("You already sent a friend request to this user.", 400));
    }

    if (requestingUser.pendingFriendRequests.includes(userToRequest.id)) {
        return next(new CustomError('You have a friend request from this user. Just accept that.', 200));
    }

    userToRequest.pendingFriendRequests.push(requestingUser.id);
    await userToRequest.save();

    requestingUser.sentFriendRequests.push(userToRequest.id);
    await requestingUser.save();

    res.status(200).json({
        success: true,
        message: "Friend request sent."
    });
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