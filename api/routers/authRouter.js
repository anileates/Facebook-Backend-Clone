const express = require('express');
const router = express.Router();
const {register, login, activateAccount, logout, resendActivationMail, forgotPassword, resetPassword, 
    editPassword, sendChangeMailCode, changeMailAddress} = require('../controllers/auth');
const {getAccessToRoute, deleteJwt} = require('../middlewares/authorization/authMiddlewares')


//.../api/auth/...

router.post("/register", register);
router.get("/activateAccount", activateAccount);
router.post("/resendActivationMail", resendActivationMail);

router.post("/login", login);
router.post("/logout", getAccessToRoute, logout, deleteJwt);

router.post("/forgotpassword", forgotPassword);
router.put("/resetpassword", resetPassword);
router.put("/editPassword", getAccessToRoute, editPassword);

router.put("/sendChangeMailCode", getAccessToRoute, sendChangeMailCode);
router.put("/changeMailAddress", getAccessToRoute, changeMailAddress);

module.exports = router;