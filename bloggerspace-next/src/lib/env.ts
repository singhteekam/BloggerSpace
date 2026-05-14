import { z } from "zod";

const clientSchema = z.object({
  NEXT_PUBLIC_BACKEND_URL: z.string().url(),
  NEXT_PUBLIC_FRONTEND_URL: z.string().url(),
  NEXT_PUBLIC_SITE_ENV: z.enum(["development", "staging", "production"]).default("development"),
  NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),
  NEXT_PUBLIC_ADSENSE_ID: z.string().optional(),
});

const raw = {
  NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL,
  NEXT_PUBLIC_FRONTEND_URL: process.env.NEXT_PUBLIC_FRONTEND_URL,
  NEXT_PUBLIC_SITE_ENV: process.env.NEXT_PUBLIC_SITE_ENV,
  NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
  NEXT_PUBLIC_ADSENSE_ID: process.env.NEXT_PUBLIC_ADSENSE_ID,
};

const parsed = clientSchema.safeParse(raw);

if (!parsed.success) {
  console.error("Invalid env vars:", parsed.error.flatten().fieldErrors);
  throw new Error("Invalid environment variables. See errors above.");
}

export const env = parsed.data;
