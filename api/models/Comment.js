const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CommentSchema = new Schema({
    userId: {
        type: mongoose.Schema.ObjectId,
        required: true,
        ref: "User"
    },
    postId: {        
        type: mongoose.Schema.ObjectId,
        required: true,
        ref: "Post"
    },
    content: {
        type: String,
        required: [true, "Provide a content"]
    },
    createdAt: {
        type: Date,
        default: Date.now,
        immutable: true 
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

module.exports = mongoose.model("Comment", CommentSchema);