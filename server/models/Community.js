const mongoose = require("mongoose");
const { commentSchema } = require("./Comment");
const User= require("./User");

const IST_OFFSET = 330;

const nestedReplyCommunityPostSchema=new mongoose.Schema({
  nestedReplyCommunityPostContent: {
    type: String,
    required: true,
  },
  nestedReplyCommunityPostAuthor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: User,
  },
  nestedReplyCommunityPostLikes: {
    type: Array,
    default: [],
  },
  createdAt: {
    type: Date,
    default: () => new Date(new Date().getTime() + IST_OFFSET * 60000),
  },
  lastUpdatedAt: {
    type: Date,
    default: "",
  },
});

const replyCommunityPostSchema=new mongoose.Schema({
    replyCommunityPostContent: {
      type: String,
      required: true,
    },
    replyCommunityPostAuthor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: User,
    },
    replyCommunityPostLikes: {
      type: Array,
      default: [],
    },
    replyCommunityPostComments: [nestedReplyCommunityPostSchema],
    createdAt: {
      type: Date,
      default: () => new Date(new Date().getTime() + IST_OFFSET * 60000),
    },
    lastUpdatedAt: {
      type: Date,
      default: "",
    },
  });
  

const communitySchema = new mongoose.Schema({
  communityPostId: {
    type: Number,
    default:()=> (new Date().getTime() + IST_OFFSET * 60000).toString().slice(-6),
  },
  communityPostSlug: {
    type: String,
    required: false,
  },
  communityPostTopic: {
    type: String,
    required: true,
  },
  communityPostCategory: {
    type: String,
    required: true,
  },
  communityPostContent: {
    type: String,
    required: true,
  },
  communityPostAuthor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: User,
  },
  communityPostStatus: {
    type: String,
    required: true,
  },
  reportCommunityPost: {
    type: Array,
    default: [],
  },
  communityPostLikes: {
    type: Array,
    default: [],
  },
  communityPostViews: {
    type: Number,
    default: 0,
  },
  communityPostComments: [replyCommunityPostSchema],
  createdAt: {
    type: Date,
    default: () => new Date(new Date().getTime() + IST_OFFSET * 60000),
  },
  lastUpdatedAt: {
    type: Date,
    default: "",
  },
});

const Community = mongoose.model("community", communitySchema);

module.exports = Community;
