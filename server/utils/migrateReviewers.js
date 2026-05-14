const Reviewer = require("../models/Reviewer");
const User = require("../models/User");

/**
 * One-time migration: copy all Reviewer documents into the User collection.
 * - If a User with the same email already exists, adds reviewer role/status to them.
 * - If no User exists, creates a new User from the Reviewer data (preserving password hash).
 * - Safe to run multiple times — skips already-migrated entries.
 */
async function migrateReviewersToUsers() {
  const reviewers = await Reviewer.find({});
  let migrated = 0;
  let skipped = 0;
  let merged = 0;

  for (const reviewer of reviewers) {
    const existingUser = await User.findOne({ email: reviewer.email });

    if (existingUser) {
      if (existingUser.role === "reviewer") {
        skipped++;
        continue;
      }
      // Existing user — elevate to reviewer
      existingUser.role = "reviewer";
      existingUser.reviewerStatus = reviewer.isVerified ? "approved" : "pending";
      existingUser.isVerified = existingUser.isVerified || reviewer.isVerified;
      if (reviewer.reviewedBlogs?.length) {
        existingUser.reviewedBlogs = reviewer.reviewedBlogs;
      }
      if (!existingUser.profilePicture && reviewer.profilePicture) {
        existingUser.profilePicture = reviewer.profilePicture;
      }
      await existingUser.save();
      merged++;
    } else {
      // Create new User from Reviewer data — preserve password hash
      const newUser = new User({
        fullName: reviewer.fullName,
        userName: reviewer.userName || ("reviewer" + reviewer.email.substring(0, reviewer.email.indexOf("@")).replace(/[^a-zA-Z0-9]/g, "")),
        email: reviewer.email,
        password: reviewer.password,
        profilePicture: reviewer.profilePicture || "",
        role: "reviewer",
        reviewerStatus: reviewer.isVerified ? "approved" : "pending",
        isVerified: reviewer.isVerified,
        status: reviewer.status || (reviewer.isVerified ? "ACTIVE" : "INACTIVE"),
        reviewedBlogs: reviewer.reviewedBlogs || [],
        createdAt: reviewer.createdAt,
      });
      await newUser.save();
      migrated++;
    }
  }

  return { total: reviewers.length, migrated, merged, skipped };
}

module.exports = migrateReviewersToUsers;
