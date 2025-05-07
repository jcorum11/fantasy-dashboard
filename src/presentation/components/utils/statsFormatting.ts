export const formatPoints = (points: number | null | undefined): string => {
  if (points === null || points === undefined) return "0";
  return Math.round(points).toString();
};

export const getPointsClass = (points: number | null | undefined): string => {
  if (points === null || points === undefined) return "text-slate-500";
  if (points > 0) return "text-green-600";
  if (points < 0) return "text-red-400";
  return "text-slate-500";
};

export const getPointsBg = (points: number | null | undefined): string => {
  if (points === null || points === undefined) return "";
  if (points > 0) return "bg-green-50";
  if (points < 0) return "bg-red-50";
  return "";
};
