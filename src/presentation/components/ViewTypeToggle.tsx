interface ViewTypeToggleProps {
  viewType: "batting" | "pitching";
  onViewTypeChange: (type: "batting" | "pitching") => void;
}

export function ViewTypeToggle({
  viewType,
  onViewTypeChange,
}: ViewTypeToggleProps) {
  return (
    <div className="flex gap-2 mb-6">
      <button
        onClick={() => onViewTypeChange("batting")}
        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
          viewType === "batting"
            ? "bg-indigo-600 text-white"
            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
        }`}
      >
        Batting
      </button>
      <button
        onClick={() => onViewTypeChange("pitching")}
        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
          viewType === "pitching"
            ? "bg-indigo-600 text-white"
            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
        }`}
      >
        Pitching
      </button>
    </div>
  );
}
