import { Platform } from "@/lib/mlb/points";

interface PlatformNavigationProps {
  platform: Platform;
  onPlatformChange: (platform: Platform) => void;
}

const PLATFORMS: { value: Platform; label: string }[] = [
  { value: "yahoo", label: "Yahoo" },
  { value: "espn", label: "ESPN" },
];

export function PlatformNavigation({
  platform,
  onPlatformChange,
}: PlatformNavigationProps) {
  return (
    <div className="flex gap-2">
      {PLATFORMS.map(({ value, label }) => {
        const isActive = platform === value;
        return (
          <button
            key={value}
            type="button"
            aria-pressed={isActive}
            onClick={() => onPlatformChange(value)}
            className={`px-3 py-1 rounded-lg font-medium transition-colors ${
              isActive
                ? "bg-indigo-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
