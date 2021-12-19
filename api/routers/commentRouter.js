const express = require('express');
const router = express.Router({ mergeParams: true }); // mergeParams lets us to get params of prev. routes. 
const { getAccessToRoute } = require('../middlewares/authorization/authMiddlewares');
const { getAllComments, makeComment, editComment, deleteComment, likeAComment, undoLikeAComment, getMoreComments } = require('../controllers/comment');
const { checkCommentExists } = require('../middlewares/database/DbQueryHelperMiddlewares');
const { getCommentOwnerAccess } = require('../middlewares/authorization/authMiddlewares')

// .../api/posts/:post_id/comments/...

router.all('*', getAccessToRoute);

router.get('/getComments', getMoreComments);
router.post('/', makeComment);
router.put('/:commentId/edit', checkCommentExists, getCommentOwnerAccess, editComment);
router.delete('/:commentId/delete', checkCommentExists, getCommentOwnerAccess, deleteComment);
router.post('/:commentId/like', checkCommentExists, likeAComment);
router.post('/:commentId/undoLike', checkCommentExists, undoLikeAComment);

module.exports = router;