import { siteConfig } from "@/lib/constants/site";
import type { Blog } from "@/types/blog";

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.description,
    author: {
      "@type": "Person",
      name: siteConfig.author.name,
      url: siteConfig.author.url,
    },
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${siteConfig.url}/blogs?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };
}

export function articleJsonLd(blog: Blog) {
  const authorName =
    blog.authorDetails?.fullName ?? blog.authorDetails?.userName ?? "BloggerSpace";
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: blog.title,
    url: `${siteConfig.url}/blogs/${blog.slug}`,
    datePublished: blog.createdAt,
    dateModified: blog.lastUpdatedAt || blog.createdAt,
    keywords: blog.tags?.join(", ") || blog.category || undefined,
    author: { "@type": "Person", name: authorName },
    publisher: { "@type": "Organization", name: siteConfig.name, url: siteConfig.url },
  };
}

export function breadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
