import { flagSrc } from "@/lib/helpers";
import { cn } from "@/lib/utils";

export default function FlagImg({ iso, className }) {
  const src = flagSrc(iso);
  if (!src) return null;
  return (
    <img
      className={cn("inline-block align-middle object-cover rounded-[2px] shadow-[0_1px_4px_rgba(0,0,0,.4)]", className)}
      src={src}
      alt={iso}
    />
  );
}
