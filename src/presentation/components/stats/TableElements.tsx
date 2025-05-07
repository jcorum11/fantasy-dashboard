import { ReactNode } from "react";

interface TableHeaderProps {
  children: ReactNode;
  align?: "left" | "right";
}

export function TableHeader({ children, align = "left" }: TableHeaderProps) {
  return (
    <th
      className={`px-4 py-2 text-${align} text-sm font-medium text-slate-600 border-b border-slate-200`}
    >
      {children}
    </th>
  );
}

interface TableCellProps {
  children: ReactNode;
  align?: "left" | "right";
  className?: string;
}

export function TableCell({
  children,
  align = "left",
  className = "",
}: TableCellProps) {
  return (
    <td
      className={`px-4 py-2 text-sm text-${align} text-slate-600 ${className}`}
    >
      {children}
    </td>
  );
}

interface PlayerNameCellProps {
  name: string;
  team: string;
}

export function PlayerNameCell({ name, team }: PlayerNameCellProps) {
  return (
    <td className="px-4 py-2 text-sm font-medium text-slate-900 whitespace-nowrap">
      <span className="font-semibold text-base">{name}</span>{" "}
      <span className="text-xs text-slate-500 align-middle font-semibold uppercase">
        {team}
      </span>
    </td>
  );
}

interface PointsCellProps {
  points: number | null | undefined;
  formatPoints: (points: number | null | undefined) => string;
  getPointsClass: (points: number | null | undefined) => string;
  getPointsBg: (points: number | null | undefined) => string;
}

export function PointsCell({
  points,
  formatPoints,
  getPointsClass,
  getPointsBg,
}: PointsCellProps) {
  return (
    <td
      className={`px-4 py-2 text-sm font-bold text-center rounded ${getPointsClass(
        points
      )} ${getPointsBg(points)}`}
    >
      {formatPoints(points)}
    </td>
  );
}
