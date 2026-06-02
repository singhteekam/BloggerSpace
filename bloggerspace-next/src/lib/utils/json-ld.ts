import { siteConfig } from "@/lib/constants/site";
import type { Blog } from "@/types/blog";

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.fullName,
    alternateName: ["BloggerSpace", "Blogger Space", "Teekam Singh Blogs"],
    url: siteConfig.url,
    description: siteConfig.description,
    inLanguage: "en",
    publisher: { "@id": `${siteConfig.url}/#organization` },
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

// Brand entity — helps Google associate the site with "BloggerSpace" and its
// founder for the Knowledge Graph.
export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${siteConfig.url}/#organization`,
    name: siteConfig.fullName,
    alternateName: ["BloggerSpace", "Blogger Space"],
    url: siteConfig.url,
    logo: `${siteConfig.url}/brand/logo128x128.png`,
    description: siteConfig.description,
    founder: {
      "@type": "Person",
      name: siteConfig.author.name,
      url: siteConfig.author.url,
    },
  };
}

// Person entity for the owner/developer — targets "Teekam Singh" searches.
export function personJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${siteConfig.url}/#person`,
    name: siteConfig.author.name,
    alternateName: "singhteekam",
    url: siteConfig.author.url,
    jobTitle: "Full-Stack Developer",
    worksFor: { "@type": "Organization", name: siteConfig.fullName, url: siteConfig.url },
    sameAs: [siteConfig.author.url].filter(Boolean),
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
