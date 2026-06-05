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
    // True when the reply was posted by an Admin. Admins aren't in the User
    // collection, so `replyCommentUser` can't be populated for them — this flag lets
    // the read path keep + label admin replies instead of dropping them as orphans.
    isAdminReply: {
      type: Boolean,
      default: false,
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
    isAdminComment: {
      type: Boolean,
      default: false,
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
