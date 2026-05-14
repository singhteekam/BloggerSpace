import categoriesJson from "@/lib/data/blog-categories.json";

export type CategoryOption = {
  value: string;
  label: string;
};

export const blogCategories: CategoryOption[] = categoriesJson;

export const blogCategoryValues: string[] = categoriesJson.map((c) => c.value);

/**
 * A short hand-picked list shown on the home page category tiles.
 * Kept separate so the tile order is editorial, not alphabetical.
 */
export const featuredCategories: CategoryOption[] = [
  { value: "Web Development", label: "Web Development" },
  { value: "Programming", label: "Programming" },
  { value: "Artificial Intelligence", label: "Artificial Intelligence" },
  { value: "DevOps", label: "DevOps" },
  { value: "Data Science", label: "Data Science" },
  { value: "Career", label: "Career" },
];
