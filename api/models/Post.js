const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Comment = require('./Comment');

const PostSchema = new Schema({
    userId: {
        type: mongoose.Schema.ObjectId,
        required: true,
        ref: "User"
    },
    content: {
        type: String,
        required: [true, "Provide a content"]
    },
    media: [
        {
            type: String
        }
    ],
    createdAt: {
        type: Date,
        default: Date.now,
        immutable: true
    },
    comments: [
        {
            type: mongoose.Schema.ObjectId,
            ref: "Comment"
        }
    ],
    commentCount: {
        type: Number,
        default: 0
    },
    likes: [
        {
            type: mongoose.Schema.ObjectId,
            ref: "User"
        }
    ],
    likeCount: {
        type: Number,
        default: 0
    }
});

PostSchema.post('remove', async function () {
    await Comment.deleteMany({
        postId: this._id
    });
});

module.exports = mongoose.model("Post", PostSchema);