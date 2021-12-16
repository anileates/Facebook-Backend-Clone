const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profile');
const { getAccessToRoute } = require('../middlewares/authorization/authMiddlewares')
const profileImageUpload = require('../middlewares/libraries/profileImageUpload');
const coverImageUpload = require('../middlewares/libraries/coverImageUpload');

router.get("/", getAccessToRoute, profileController.getSelfProfile);
router.get('/get-basics', getAccessToRoute, profileController.getBasics);
router.put("/edit-personal-data", getAccessToRoute, profileController.editPersonalData);

router.post("/upload-profile-image", [getAccessToRoute, profileImageUpload.single("profile_image")], profileController.uploadProfileImage);
router.post("/upload-cover-image", [getAccessToRoute, coverImageUpload.single("cover_image")], profileController.uploadCoverImage);

router.get('/get-feed', getAccessToRoute, profileController.getFeed);
router.get('/get-shared-posts', getAccessToRoute, profileController.getSharedPosts);

module.exports = router;