import { SearchIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The search box of the Details modal and the site picker: a magnifier, a visually
 * hidden label and a 44 px target on touch screens. Filtering is the caller's job.
 */
export function SearchInput({
  id,
  label,
  value,
  onChange,
  placeholder = "Search…",
  className,
}: {
  id: string;
  /** Read by screen readers: "Search cities". */
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <SearchIcon
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <input
        id={id}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        className="h-9 w-full rounded-lg border bg-background pr-3 pl-9 text-sm transition-[border-color,box-shadow] duration-150 outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 pointer-coarse:h-11"
      />
    </div>
  );
}
