const mongoose = require("mongoose");
const User= require("./User");

const IST_OFFSET = 330;

const replyCommentSchema= new mongoose.Schema(
  {
    replyCommentContent: {
      type: String,
      required: true,
    },
    replyCommentUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: User,
      required: true,
    },
    commentLikes: {
      type: Array,
      default: [],
    },
    createdAt: {
      type: Date,
      default: () => new Date(new Date().getTime() + IST_OFFSET * 60000),
    },
  }
);

const commentSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: User,
      required: true,
    },
    commentLikes: {
      type: Array,
      default: [],
    },
    commentReplies:[replyCommentSchema],
    createdAt: {
      type: Date,
      default: () => new Date(new Date().getTime() + IST_OFFSET * 60000),
    },
  }
  // { timestamps: true }
);

// const Comment = mongoose.model("Comment", commentSchema);

// module.exports = Comment;
module.exports = {
  commentSchema,
  replyCommentSchema
};
