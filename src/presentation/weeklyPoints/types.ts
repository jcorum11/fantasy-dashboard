export interface PlayerWeekly {
  id: number;
  fullName: string;
  teamName: string;
  positionAbbr: string;
  weeklyPoints: number[];
  totalPoints: number;
  isRostered: boolean;
} 