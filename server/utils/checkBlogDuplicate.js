// Shared guard against duplicate blog publication: a blog's title AND slug must
// each be unique across the whole collection. Pass `excludeId` when editing an
// existing blog so it doesn't conflict with itself.
//
// Returns a human-readable error message if a conflict is found, otherwise null.
async function checkBlogDuplicate(Blog, { title, slug, excludeId } = {}) {
  const base = excludeId ? { _id: { $ne: excludeId } } : {};

  if (title) {
    const dup = await Blog.findOne({ ...base, title }).select("_id").lean();
    if (dup) return "A blog with this title already exists. Please use a unique title.";
  }

  if (slug) {
    const dup = await Blog.findOne({ ...base, slug }).select("_id").lean();
    if (dup) return "A blog with this URL slug already exists. Please use a unique slug.";
  }

  return null;
}

module.exports = { checkBlogDuplicate };
