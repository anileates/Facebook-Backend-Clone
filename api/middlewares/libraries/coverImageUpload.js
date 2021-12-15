const multer = require('multer');
const path = require('path');
const CustomError = require('../../helpers/errorHelpers/CustomError');
const fs = require('fs');
const errorsEnum = require('../../helpers/errorHelpers/errorsEnum');

const storage = multer.diskStorage({
    //funcs to get some data to set destination or filename
    destination: function (req, file, callback) {
        const rootDir = path.dirname(require.main.filename);
        const imagesPath1 = path.join(rootDir, "/public/uploads/coverImages");
        fs.mkdirSync(imagesPath1, { recursive: true })

        callback(null, imagesPath1);
    },

    filename: function (req, file, callback) {
        //Set filename which we will send to database
        const extension = file.mimetype.split("/")[1];
        let imageName = "coverImage_" + req.loggedUser.id + "." + extension;
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

//We implement configs above in here
const coverImageUpload = multer({ storage, fileFilter });

module.exports = coverImageUpload;