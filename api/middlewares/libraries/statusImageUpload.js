const multer = require('multer');
const path = require('path');
const CustomError = require('../../helpers/errorHelpers/CustomError');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');


//Storage, FileFilter
//These are some configs, not funcs. We just set configs to implement in multer bottom of page.
const storage = multer.diskStorage({
    //funcs to get some data to set destination or filename
    destination: function(req, file, callback){
        const rootDir = path.dirname(require.main.filename);
        const imagesPath = path.join(rootDir, "/public/uploads/postMedia");
        fs.mkdirSync(imagesPath, { recursive: true })
        callback(null, imagesPath);
    },

    filename: function(req, file, callback){
        //Set filename which we will send to database
        const extension = file.mimetype.split("/")[1];
        let fileName = "media_" + req.loggedUser.id + "_" + uuidv4() + "." + extension;
        callback(null, fileName);
    }
});

const fileFilter = (req, file, callback) => {
    let allowedMimeTypes = ["image/jpg", "image/gif", "image/jpeg", "image/png", "video/webm", "video/mp4"];

    if(!allowedMimeTypes.includes(file.mimetype)){
        return callback(new CustomError("Please provide a valid image file", 400), false);
    }

    return callback(null, true);
}

//We implement configs above in here
const statusImageUpload = multer({storage, fileFilter});

module.exports = statusImageUpload;