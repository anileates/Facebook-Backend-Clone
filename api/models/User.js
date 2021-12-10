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
        enum: ['kadın', 'erkek', 'diğer'] //enum arrayi secimleri kisitlar
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
        select: false // DB'den user'ı çektiğinde default olarak şifrenin görünmemesi için
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
    activateAccToken: { type: String },
    resetPasswordToken: { type: String },
    resetPasswordExpire: { type: Date },
    currentCity: { type: String },
    hometown: { type: String },
    relationShip: {
        type: String,
        default: undefined,
        enum: ['single', 'in a relationship', 'engaged', 'married', 'divorced', 'widowed']
    },
    homePageStatus: [
        {
            type: mongoose.Schema.ObjectId,
            ref: "Post"
        }
    ], //ana sayfada görüntülenecek gönderiler. Bir nevi anasayfası
    sharedPosts: [
        {
            type: mongoose.Schema.ObjectId,
            ref: "Post"
        }
    ], //kendi paylaştığı gönderiler
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
    ], //bu kullanıcıya gelen arkadaşlık istekleri
    sentFriendRequests: [
        {
            type: mongoose.Schema.ObjectId,
            ref: "User"
        }
    ], //bu kullanıcının attığı istekler
    sessionJwtTokens: [
        { type: String }
    ],
    changeEmailCode: {
        type: String
    }
});

UserSchema.methods.generateJwtFromUser = function () {
    // kullanıcı için JWT üretir
    const { JWT_SECRET_KEY } = process.env;

    const payload = {
        id: this._id,
        email: this.email
    };

    const token = jwt.sign(payload, JWT_SECRET_KEY);
    this.sessionJwtTokens.push(token);
    return token;
};

UserSchema.pre('save', function (next) {
    //isModified fonk. mongodan gelir. belirtilen alan degismis mi diye bakar.
    //kullaniciyi guncellerken sıkıntı çıkmaması için
    if (!this.isModified('password')) {
        return next();
    }

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
    // Bir kullanıcı kaldırılığında o kullanıcının gönderilerini de kaldır.
    try {
        await Post.deleteMany({
            userId: this._id
        });
    } catch (error) {
        return next(err);
    }
});

UserSchema.methods.generateResetPasswordTokenFromUser = function () {
    const randomHexString = crypto.randomBytes(15).toString("hex");

    const { RESET_PASSWORD_EXPIRE } = process.env;

    const resetPasswordToken =
        crypto.createHash("SHA256")
            .update(randomHexString)
            .digest("hex");

    this.resetPasswordToken = resetPasswordToken;
    this.resetPasswordExpire = Date.now() + parseInt(RESET_PASSWORD_EXPIRE)

    return resetPasswordToken;
}

UserSchema.methods.generateActivateAccountToken = function () {
    //Kripte edilmiş bir token üretir. Bu token hesap aktive etmek içindir, mail adresine gönderilen URL'ye eklenir. 
    const randomHexString = crypto.randomBytes(18).toString("hex");

    const activateAccToken =
        crypto.createHash("SHA256")
            .update(randomHexString)
            .digest("hex");

    this.activateAccToken = activateAccToken;

    return activateAccToken;
}

UserSchema.methods.generateChangeEmailCode = function () {
    const code = Math.floor(100000 + Math.random() * 900000);

    this.changeEmailCode = code;
    return code;
}

module.exports = mongoose.model("User", UserSchema);