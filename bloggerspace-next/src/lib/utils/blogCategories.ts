import categoryData from "@/data/blogCategory.json";
import tagsData from "@/data/blogTags.json";

/** All blog categories as a plain string array. Single source of truth. */
export const BLOG_CATEGORIES: string[] = (
  categoryData as { value: string; label: string }[]
).map((c) => c.value);

/** All blog tags as a plain string array. Single source of truth. */
export const BLOG_TAGS: string[] = tagsData as string[];
