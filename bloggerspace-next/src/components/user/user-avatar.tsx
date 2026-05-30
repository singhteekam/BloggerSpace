import { cn } from "@/lib/utils/cn";
import { toProfilePicSrc } from "@/lib/utils/profile-pic";

const sizes = {
  xs:  { wrap: "size-6",  text: "text-[9px]"  },
  sm:  { wrap: "size-8",  text: "text-[11px]" },
  md:  { wrap: "size-10", text: "text-xs"     },
  lg:  { wrap: "size-14", text: "text-lg"     },
  xl:  { wrap: "size-20", text: "text-2xl"    },
} as const;

type Props = {
  src?: string | null;
  name: string;
  size?: keyof typeof sizes;
  className?: string;
};

export function UserAvatar({ src, name, size = "md", className }: Props) {
  const picSrc = toProfilePicSrc(src);
  const { wrap, text } = sizes[size];
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (picSrc) {
    return (
      // Using <img> intentionally — base64 data URIs are incompatible with
      // Next.js <Image> which requires a resolvable URL or configured domain.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={picSrc}
        alt={name}
        draggable={false}
        onContextMenu={(e) => e.preventDefault()}
        className={cn("rounded-full object-cover shrink-0", wrap, className)}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full bg-primary/10 font-bold text-primary shrink-0",
        wrap,
        text,
        className,
      )}
    >
      {initials}
    </div>
  );
}
