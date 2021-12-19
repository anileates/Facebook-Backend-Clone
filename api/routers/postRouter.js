const express = require('express');
const router = express.Router();
const { getAccessToRoute, getPostOwnerAccess } = require('../middlewares/authorization/authMiddlewares')
const { createPost, deletePost, editPost, likePost, undoLikePost, getSinglePost } = require('../controllers/post');
const { checkPostExist } = require("../middlewares/database/DbQueryHelperMiddlewares");
const commentRouter = require('./commentRouter');
const statusImageUpload = require('../middlewares/libraries/statusImageUpload');

//.../api/posts/...

router.get('/:postId', [getAccessToRoute, checkPostExist], getSinglePost);
router.post("/create-post", getAccessToRoute, statusImageUpload.fields([
    {
        name: 'media', maxCount: 3
    },
    {
        name: 'content', maxCount: 1
    }
]), createPost);

router.delete("/:postId", [getAccessToRoute, checkPostExist, getPostOwnerAccess], deletePost);
router.put("/:postId/edit", [getAccessToRoute, checkPostExist, getPostOwnerAccess], editPost);
router.post("/:postId/like", [getAccessToRoute, checkPostExist], likePost);
router.post("/:postId/undoLike", [getAccessToRoute, checkPostExist], undoLikePost);

// .../api/posts/:post_id/answers şeklinde post'a bağlı olduğu için böyle bir route kullandık
router.use("/:postId/comments", checkPostExist, commentRouter);

module.exports = router;