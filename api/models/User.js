const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const Post = require('./Post');

const UserSchema = new Schema({
    firstName: {
        type: String,
        required: [true, "Please provide a name"]
    },
    lastName: {
        type: String,
        required: [true, "Please provide a lastname"]
    },
    birthday: {
        type: Date,
        required: [true, "Please provide a birthday."]
    },
    gender: {
        type: String,
        required: [true, "Please provide a gender"],
        enum: ['woman', 'man', 'other']
    },
    email: {
        type: String,
        required: [true, "Please provide a email"],
        unique: true,
        match: [
            /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/,
            'Please provide a valid email'
        ]
    },
    password: {
        type: String,
        minLength: [6, "Please provide a password with min length 6"],
        required: [true, "Please provide a password"],
        select: false // Don't fetch password by default when a user is fetched from DB
    },
    createdAt: {
        type: Date,
        default: new Date(),
        immutable: true
    },
    profile_image: {
        type: String,
        default: 'default_profile.jpg'
    },
    cover_image: {
        type: String,
        default: 'default_cover.jpg'
    },
    enabled: {
        type: Boolean,
        default: false
    },
    accountActivationToken: { type: String },
    resetPasswordToken: { type: String },
    resetPasswordExpire: { type: Date },
    currentCity: { type: String },
    hometown: { type: String },
    relationShip: {
        type: String,
        default: undefined,
        enum: ['single', 'in a relationship', 'engaged', 'married', 'divorced', 'widowed']
    },
    feed: [
        {
            type: mongoose.Schema.ObjectId,
            ref: "Post"
        }
    ],
    sharedPosts: [
        {
            type: mongoose.Schema.ObjectId,
            ref: "Post"
        }
    ],
    friends: [
        {
            type: mongoose.Schema.ObjectId,
            ref: "User"
        }
    ],
    pendingFriendRequests: [
        {
            type: mongoose.Schema.ObjectId,
            ref: "User"
        }
    ],
    sentFriendRequests: [
        {
            type: mongoose.Schema.ObjectId,
            ref: "User"
        }
    ],
    sessionTokens: [
        { type: String }
    ],
    emailChangingCode: {
        type: String
    }
});

UserSchema.methods.generateJwtFromUser = function () {
    // Generate a signed JWT token whose payload contains user id and email
    // And client uses that token as access token
    const { JWT_SECRET_KEY } = process.env;

    const payload = {
        id: this._id,
        email: this.email
    };

    const token = jwt.sign(payload, JWT_SECRET_KEY);
    this.sessionTokens.push(token);
    return token;
};

UserSchema.pre('save', function (next) {
    // This method runs every time when UserObject is saved
    // And checks if the password field is changed or not

    // If password is not changed, break this method and go next
    if (!this.isModified('password')) {
        return next();
    }

    // If password is changed than encrypt the password again
    bcrypt.genSalt(10, (err, salt) => {
        if (err) next(err);
        bcrypt.hash(this.password, salt, (err, hash) => {
            if (err) next(err);
            this.password = hash;
            next();
        });
    });
});

UserSchema.post('remove', async function () {
    // Remove all user posts when a user is deleted 
    try {
        await Post.deleteMany({
            userId: this._id
        });
    } catch (error) {
        return next(err);
    }
});

UserSchema.methods.generateResetPasswordTokenFromUser = function () {
    const { RESET_PASSWORD_EXPIRE } = process.env;

    /**
     * First create a 15 randomBytes hex'ed string 
     * Than hash this string with SHA256
     */
    const randomHexString = crypto.randomBytes(15).toString("hex");
    const resetPasswordToken =
        crypto.createHash("SHA256")
            .update(randomHexString)
            .digest("hex");

    // Set a expiration date for this token in DB
    this.resetPasswordToken = resetPasswordToken;
    this.resetPasswordExpire = Date.now() + parseInt(RESET_PASSWORD_EXPIRE)

    return resetPasswordToken;
}

UserSchema.methods.generateteAccountActivationToken = function () {
    // Generates a random string
    const randomHexString = crypto.randomBytes(18).toString("hex");

    // And then, encrypt it by SHA256
    const accountActivationToken =
        crypto.createHash("SHA256")
            .update(randomHexString)
            .digest("hex");

    this.accountActivationToken = accountActivationToken;
    return accountActivationToken;
}

UserSchema.methods.generateemailChangingCode = function () {
    // Just generate a 6 digit random code. 
    // Client must enter this code when wanted to change its email adress
    const code = Math.floor(100000 + Math.random() * 900000);

    this.emailChangingCode = code;
    return code;
}

module.exports = mongoose.model("User", UserSchema);