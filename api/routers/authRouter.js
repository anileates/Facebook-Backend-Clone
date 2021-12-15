const express = require('express');
const router = express.Router();
const { register, login, activateAccount, logout, resendActivationMail, forgotPassword, resetPassword,
    editPassword, requestMailChange, changeMailAddress } = require('../controllers/auth');
const { getAccessToRoute, deleteJwt } = require('../middlewares/authorization/authMiddlewares')

//.../api/auth/...

router.post("/register", register);
router.get("/activate-account", activateAccount);
router.post("/resend-activation-mail", resendActivationMail);

router.post("/login", login);
router.post("/logout", getAccessToRoute, logout, deleteJwt);

router.post("/forgot-password", forgotPassword);
router.put("/reset-password", resetPassword);
router.put("/edit-password", getAccessToRoute, editPassword);

router.put("/request-mail-change", getAccessToRoute, requestMailChange);
router.put("/change-mail-address", getAccessToRoute, changeMailAddress);

module.exports = router;