import { format } from "date-fns";

interface DateNavigationProps {
  currentDate: Date;
  isLoading: boolean;
  onPreviousDay: () => void;
  onNextDay: () => void;
  canNavigateNext: boolean;
}

export function DateNavigation({
  currentDate,
  isLoading,
  onPreviousDay,
  onNextDay,
  canNavigateNext,
}: DateNavigationProps) {
  const formattedDate = format(currentDate, "MMM d, yyyy");

  return (
    <div className="flex items-center gap-4">
      <p className="text-lg text-slate-500 font-medium">
        Top Performers for{" "}
        <span className="font-semibold text-slate-700">{formattedDate}</span>
      </p>

      <div className="flex gap-2">
        <button
          onClick={onPreviousDay}
          disabled={isLoading}
          className="px-3 py-1 rounded-lg font-medium transition-colors bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous Day
        </button>
        <button
          onClick={onNextDay}
          disabled={isLoading || !canNavigateNext}
          className="px-3 py-1 rounded-lg font-medium transition-colors bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next Day
        </button>
      </div>
    </div>
  );
}
