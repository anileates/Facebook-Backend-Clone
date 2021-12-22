const express = require('express');
const router = express.Router();
const { getUser, addFriend, acceptFriendRequest, unfriend, searchUser, cancelRequest, denyRequest, getUserPosts } = require('../controllers/user');
const { checkUserExist } = require('../middlewares/database/DbQueryHelperMiddlewares.js');
const { getAccessToRoute } = require('../middlewares/authorization/authMiddlewares');
// .../api/users/...

router.get('/:userId', getAccessToRoute, checkUserExist, getUser);
router.get('/:userId/posts', [getAccessToRoute, checkUserExist], getUserPosts);
router.post('/:userId/add-friend', [getAccessToRoute, checkUserExist], addFriend);
router.post('/:userId/accept-friend-request', [getAccessToRoute, checkUserExist], acceptFriendRequest);
router.post('/:userId/remove-friend', [getAccessToRoute, checkUserExist], unfriend);
router.post('/:userId/cancel-friend-request', [getAccessToRoute, checkUserExist], cancelRequest);
router.post('/:userId/deny-friend-request', [getAccessToRoute, checkUserExist], denyRequest);
router.get('/', getAccessToRoute, searchUser);


module.exports = router;