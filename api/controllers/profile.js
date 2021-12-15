const User = require('../models/User');
const CustomError = require('../helpers/errorHelpers/CustomError');
const asyncErrorWrapper = require('express-async-handler');
const errorsEnum = require('../helpers/errorHelpers/errorsEnum');

/**
 * @getBasics method returns basic information to be displayed at the navbar. Like name, profile photo notifications etc...
 */
const getBasics = asyncErrorWrapper(async (req, res, next) => {
    const userId = req.loggedUser.id;

    const user =
        await User.find({ _id: userId })
            .select('firstName lastName pendingFriendRequests profile_image cover_image')
            .populate({ path: 'pendingFriendRequests', select: 'firstName lastName profile_image cover_image' });

    res.status(200).json({
        success: true,
        user: user[0]
    });
});

const getSelfProfile = asyncErrorWrapper(async (req, res, next) => {
    const userId = req.loggedUser.id;

    const user =
        await User.findById(userId)
            .select('-enabled -accountActivationToken -password -createdAt -homePageStatus -sharedPosts -__v -sessionTokens')
            .populate({ path: 'friends', select: 'firstName lastName profile_image cover_image' });

    res.status(200).json({
        success: true,
        user: user
    });
});

const editPersonalData = asyncErrorWrapper(async (req, res, next) => {
    /**
     * @allowedPlaces array contains the places allowed to change from this route. 
     * Implemented this so that we can restrict access to important places about authorization. 
     */
    const allowedPlaces = ['firstName', 'lastName', 'birthday', 'gender', 'relationShip', 'currentCity', 'hometown'];
    const updated = req.body;

    let user = await User.findById(req.loggedUser.id);

    updated.foreach(element => {
        if (!allowedPlaces.includes(element)) return next(new CustomError(errorsEnum.FORBIDDEN_FIELD, 400))

        user[element] = updated[element]
    })

    await user.save();

    res.status(200).json({
        success: true,
        message: "Places updated successfully"
    });
});

const uploadProfileImage = asyncErrorWrapper(async (req, res, next) => {
    const userId = req.loggedUser.id;

    if (!req.file) {
        return res.sendStatus(200);
    }

    const user = await User.findByIdAndUpdate(userId, {
        "profile_image": req.file.filename
    }, {
        new: true,
        runValidators: true
    });

    res.status(200).json({
        success: true,
        user
    });
});

const uploadCoverImage = asyncErrorWrapper(async (req, res, next) => {
    const userId = req.loggedUser.id;

    if (!req.file) {
        return next(new CustomError('Please provide a valid image', 400));
    }

    const user = await User.findByIdAndUpdate(userId, {
        "cover_image": req.file.filename
    }, {
        new: true,
        runValidators: true
    });

    res.status(200).json({
        success: true,
        message: "Cover Image Uploaded."
    });
});

const getHomePagePosts = asyncErrorWrapper(async (req, res, next) => {
    const userId = req.loggedUser.id;
    //Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    const pagination = {};
    const user = await User.findById(userId);

    const totalPost = user.homePageStatus.length;

    if (startIndex > 0) {
        pagination.previous = {
            page: page - 1,
            limit: limit
        }
    }
    console.log(endIndex, totalPost)
    if (endIndex < totalPost) {
        console.log('if ici')
        pagination.next = {
            page: page + 1,
            limit: limit
        }
    }

    let posts = await User.find({ _id: userId }).select('-_id homePageStatus')
        .where('homePageStatus').slice(startIndex, limit)
        .populate({ path: 'homePageStatus', select: '-comments', populate: { path: 'userId', select: 'profile_image cover_image firstName lastName' } });

    let postsArrayObject = posts[0].homePageStatus.toObject();

    res.status(200).json({
        success: true,
        pagination: pagination,
        data: postsArrayObject
    });
});

const getSharedPosts = asyncErrorWrapper(async (req, res, next) => {
    const userId = req.params.userId || req.loggedUser.id;

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

module.exports = {
    getBasics,
    getSelfProfile,
    editPersonalData,
    uploadProfileImage,
    uploadCoverImage,
    getHomePagePosts,
    getSharedPosts
};