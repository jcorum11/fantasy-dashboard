import { WarningMessage } from "./WarningMessage";

interface StatsStatusProps {
  isLoading: boolean;
  message: string | null;
}

export function StatsStatus({ isLoading, message }: StatsStatusProps) {
  if (!isLoading && !message) return null;

  return (
    <div className="mt-4 text-center">
      {isLoading && (
        <div className="text-slate-600">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600"></div>
          <span className="ml-2">Loading stats...</span>
        </div>
      )}
      {message && <WarningMessage message={message} />}
    </div>
  );
}
