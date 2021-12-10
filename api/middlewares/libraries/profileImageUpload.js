const multer = require('multer');
const path = require('path');
const CustomError = require('../../helpers/errorHelpers/CustomError');
const fs = require('fs');

//Storage, FileFilter
//These are some configs, not funcs. We just set configs to implement in multer bottom of page.
const storage = multer.diskStorage({
    //funcs to get some data to set destination or filename
    destination: function(req, file, callback){
        const rootDir = path.dirname(require.main.filename);
        const imagesPath = path.join(rootDir, "/public/uploads/profileImages");
        fs.mkdirSync(imagesPath, { recursive: true })

        callback(null, imagesPath);
    },

    filename: function(req, file, callback){
        //Set filename which we will send to database
        const extension = file.mimetype.split("/")[1];
        let imageName = "profileImage_" + req.loggedUser.id + "." + extension;
        callback(null, imageName);
    }
});

const fileFilter = (req, file, callback) => {
    let allowedMimeTypes = ["image/jpg", "image/gif", "image/jpeg", "image/png"];

    if(!allowedMimeTypes.includes(file.mimetype)){
        return callback(new CustomError("Please provide a valid image file", 400), false);
    }

    return callback(null, true);
}

//We implement configs above in here
const profileImageUpload = multer({storage, fileFilter});

module.exports = profileImageUpload;