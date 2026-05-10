import type { FC } from "react";
import { clsx } from "clsx";

interface Props {
  name: string;
  src?: string | null;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

const sizes = { xs: "w-6 h-6 text-xs", sm: "w-8 h-8 text-sm", md: "w-10 h-10 text-base", lg: "w-12 h-12 text-lg" };

function initials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

const COLORS = ["bg-indigo-500", "bg-violet-500", "bg-blue-500", "bg-emerald-500", "bg-rose-500", "bg-amber-500"];
function colorFor(name: string): string {
  const idx = name.charCodeAt(0) % COLORS.length;
  return COLORS[idx]!;
}

export const Avatar: FC<Props> = ({ name, src, size = "sm", className }) => {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={clsx("rounded-full object-cover", sizes[size], className)}
      />
    );
  }
  return (
    <div
      className={clsx(
        "rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0",
        sizes[size],
        colorFor(name),
        className
      )}
      title={name}
    >
      {initials(name)}
    </div>
  );
};
