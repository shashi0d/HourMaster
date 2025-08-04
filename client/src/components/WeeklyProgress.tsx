import { useMemo } from "react";
import type { Category, TimeEntry, WeeklyGoal } from "@shared/schema";

interface WeeklyProgressProps {
  categories: Category[];
  weeklyEntries: TimeEntry[];
  weeklyGoals: WeeklyGoal[];
}

export default function WeeklyProgress({ 
  categories, 
  weeklyEntries, 
  weeklyGoals 
}: WeeklyProgressProps) {
  const progressData = useMemo(() => {
    const totalPlanned = weeklyGoals.reduce((sum, goal) => sum + goal.targetHours, 0);
    const totalActual = weeklyEntries.reduce((sum, entry) => sum + entry.actualHours, 0);
    const percentage = totalPlanned > 0 ? Math.round((totalActual / totalPlanned) * 100) : 0;
    const remaining = Math.max(0, totalPlanned - totalActual);
    
    // Calculate SVG circle properties
    const radius = 52;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;
    
    return {
      totalPlanned,
      totalActual,
      percentage,
      remaining,
      strokeDashoffset,
      circumference,
    };
  }, [weeklyEntries, weeklyGoals]);

  // Get today's goal and average
  const todayGoal = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayEntries = weeklyEntries.filter(entry => entry.date === today);
    return todayEntries.reduce((sum, entry) => sum + entry.plannedHours, 0);
  }, [weeklyEntries]);

  const dailyAverage = useMemo(() => {
    const daysWithEntries = new Set(weeklyEntries.map(entry => entry.date)).size;
    if (daysWithEntries === 0) return 0;
    return Math.round(progressData.totalActual / daysWithEntries);
  }, [weeklyEntries, progressData.totalActual]);

  const weekRange = useMemo(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1));
    
    return `${progressData.totalActual}/${progressData.totalPlanned} hours`;
  }, [progressData]);

  return (
    <div className="bg-dark-secondary rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">This Week</h2>
        <span className="text-sm text-text-muted">{weekRange}</span>
      </div>
      
      <div className="flex items-center justify-center mb-6">
        <div className="relative w-32 h-32">
          <svg className="w-32 h-32 progress-ring">
            <circle 
              cx="64" 
              cy="64" 
              r="52" 
              stroke="hsl(240, 5%, 18%)" 
              strokeWidth="8" 
              fill="none"
            />
            <circle 
              cx="64" 
              cy="64" 
              r="52" 
              stroke="url(#gradient)" 
              strokeWidth="8" 
              fill="none" 
              strokeLinecap="round" 
              strokeDasharray={progressData.circumference}
              strokeDashoffset={progressData.strokeDashoffset}
              className="transition-all duration-500"
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="hsl(217, 91%, 60%)"/>
                <stop offset="50%" stopColor="hsl(262, 83%, 69%)"/>
                <stop offset="100%" stopColor="hsl(158, 64%, 52%)"/>
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold">{progressData.percentage}%</div>
              <div className="text-xs text-text-muted">Complete</div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex justify-between text-sm">
        <div className="text-center">
          <div className="text-text-muted">Remaining</div>
          <div className="font-semibold text-workout-green">{progressData.remaining}h</div>
        </div>
        <div className="text-center">
          <div className="text-text-muted">Today Goal</div>
          <div className="font-semibold text-study-blue">{todayGoal}h</div>
        </div>
        <div className="text-center">
          <div className="text-text-muted">Average</div>
          <div className="font-semibold text-sleep-purple">{dailyAverage}h</div>
        </div>
      </div>
    </div>
  );
}
