export type BlogAuthor = {
  _id: string;
  fullName: string;
  userName?: string;
  email?: string;
  profilePicture?: string;
};

export type BlogReply = {
  _id: string;
  replyCommentContent: string;
  replyCommentUser: BlogAuthor;
  commentLikes: string[];
  createdAt: string;
};

export type BlogComment = {
  _id: string;
  content: string;
  user: BlogAuthor;
  commentLikes: string[];
  commentReplies: BlogReply[];
  createdAt: string;
};

export type ReviewFeedback = {
  ReviewerId?: string;
  ReviewerEmail?: string;
  Feedback: string;
  LastUpdated?: string;
};

export type ReviewRecord = {
  ReviewedBy?: {
    Id?: string;
    Email?: string;
    Role?: string;
  };
  Rating?: number;
  Remarks?: string;
  statusTransition?: string;
  LastUpdatedAt?: string;
};

export type Blog = {
  _id: string;
  blogId: number;
  slug: string;
  title: string;
  category: string;
  tags: string[];
  content: string;
  authorDetails: BlogAuthor;
  status: string;
  blogViews: number;
  blogLikes: { userId: string; likedTime: string }[];
  comments: BlogComment[];
  createdAt: string;
  lastUpdatedAt: string;
  feedbackToAuthor?: ReviewFeedback[];
  reviewedBy?: ReviewRecord[];
  gems?: {
    awarded: boolean;
    authorGems: number;
    reviewerGems?: number;
    reviewerUserId?: string;
    reviewerAwards?: { userId: string; gems: number }[];
  };
};

export type BlogListResponse = {
  blogs: Blog[];
  total: number;
  page: number;
  pages: number;
};
