const express = require('express');
const router = express.Router();
const { getUser, addFriend, acceptFriendRequest, unfriend, searchUser, cancelRequest, denyRequest } = require('../controllers/user');
const { checkUserExist } = require('../middlewares/database/databaseErrorMiddlewares.js');
const { getAccessToRoute } = require('../middlewares/authorization/authMiddlewares');
const { getSharedPosts } = require('../controllers/profile')
// .../api/users/...

router.get('/:userId', getAccessToRoute, checkUserExist, getUser);
router.get('/:userId/posts', [getAccessToRoute, checkUserExist], getSharedPosts); 
router.post('/:userId/addFriend', [getAccessToRoute, checkUserExist], addFriend);
router.post('/:userId/acceptFriendRequest', [getAccessToRoute, checkUserExist], acceptFriendRequest);
router.post('/:userId/unfriend', [getAccessToRoute, checkUserExist], unfriend);
router.post('/:userId/cancelFriendRequest', [getAccessToRoute, checkUserExist], cancelRequest);
router.post('/:userId/denyFriendRequest', [getAccessToRoute, checkUserExist], denyRequest);
router.get('/', getAccessToRoute, searchUser);


module.exports = router;