const express = require('express');
const router = express.Router({ mergeParams: true }); // mergeParams lets us to get params of prev. routes. 
const { getAccessToRoute } = require('../middlewares/authorization/authMiddlewares');
const { makeComment, editComment, deleteComment, likeAComment, undoLikeAComment, getMoreComments } = require('../controllers/comment');
const { checkCommentExists } = require('../middlewares/database/DbQueryHelperMiddlewares');
const { getCommentOwnerAccess } = require('../middlewares/authorization/authMiddlewares')

// .../api/posts/:post_id/comments/...

router.all('*', getAccessToRoute);

router.post('/', makeComment);
router.get('/getComments', getMoreComments);
router.put('/:commentId', checkCommentExists, getCommentOwnerAccess, editComment);
router.delete('/:commentId', checkCommentExists, getCommentOwnerAccess, deleteComment);
router.post('/:commentId/like', checkCommentExists, likeAComment);
router.post('/:commentId/undoLike', checkCommentExists, undoLikeAComment);

module.exports = router;