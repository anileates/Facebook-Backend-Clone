const multer = require('multer');
const path = require('path');
const CustomError = require('../../helpers/errorHelpers/CustomError');
const fs = require('fs');
const errorsEnum = require('../../helpers/errorHelpers/errorsEnum');

/**
 * These are some configs, not funcs. 
 * We just set configs to implement in multer which is created at bottom of page.
 */
const storage = multer.diskStorage({
    /**
     * @imagesPath is under the public as this is just DEV Server. 
     */
    destination: function (req, file, callback) {
        const rootDir = path.dirname(require.main.filename);
        const imagesPath = path.join(rootDir, "/public/uploads/profileImages");
        fs.mkdirSync(imagesPath, { recursive: true })

        callback(null, imagesPath);
    },

    filename: function (req, file, callback) {
        //Set filename which we will send to database
        const extension = file.mimetype.split("/")[1];
        let imageName = "profileImage_" + req.loggedUser.id + "." + extension;
        callback(null, imageName);
    }
});

const fileFilter = (req, file, callback) => {
    let allowedMimeTypes = ["image/jpg", "image/gif", "image/jpeg", "image/png"];

    if (!allowedMimeTypes.includes(file.mimetype)) {
        return callback(new CustomError(errorsEnum.INVALID_MIME_TYPE, 400), false);
    }

    return callback(null, true);
}

//We implement configs in here
const profileImageUpload = multer({ storage, fileFilter });

module.exports = profileImageUpload;