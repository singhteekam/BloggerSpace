// Shared guard against duplicate blog publication: a blog's title AND slug must
// each be unique across the whole collection.
//
//  • `excludeId` — exclude this blog from the search (don't conflict with self).
//  • `original`  — the blog being edited. When provided, a field is checked ONLY
//    if it actually CHANGED from the original. This means editing an existing blog
//    (e.g. fixing content) never re-validates an unchanged title/slug — so a
//    pre-existing/legacy duplicate can't block a normal edit. New blogs pass no
//    `original`, so their title + slug are always checked.
//
// Returns a human-readable error message if a conflict is found, otherwise null.
async function checkBlogDuplicate(Blog, { title, slug, excludeId, original } = {}) {
  const base = excludeId ? { _id: { $ne: excludeId } } : {};

  const checkTitle = original ? (!!title && title !== original.title) : !!title;
  const checkSlug = original ? (!!slug && slug !== original.slug) : !!slug;

  if (checkTitle) {
    const dup = await Blog.findOne({ ...base, title }).select("_id").lean();
    if (dup) return "A blog with this title already exists. Please use a unique title.";
  }

  if (checkSlug) {
    const dup = await Blog.findOne({ ...base, slug }).select("_id").lean();
    if (dup) return "A blog with this URL slug already exists. Please use a unique slug.";
  }

  return null;
}

module.exports = { checkBlogDuplicate };
