import { useMemo } from "react";
import type { Category, TimeEntry, WeeklyGoal, DailyPlan } from "@shared/schema";

interface WeeklyProgressProps {
  categories: Category[];
  weeklyEntries: TimeEntry[];
  weeklyGoals: WeeklyGoal[];
  dailyPlans: DailyPlan[];
}

// Timezone-safe date formatting
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Get week start (Monday)
function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  // If it's Sunday (day = 0), we go back 6 days to get to Monday
  // If it's any other day, we go back (day - 1) days to get to Monday
  const diff = d.getDate() - (day === 0 ? 6 : day - 1);
  d.setDate(diff);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const dayOfMonth = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${dayOfMonth}`;
}

export default function WeeklyProgress({ 
  categories, 
  weeklyEntries, 
  weeklyGoals,
  dailyPlans
}: WeeklyProgressProps) {
  // Use the already filtered data from weekData instead of re-filtering
  const progressData = useMemo(() => {
    // Calculate total planned hours from the provided daily plans
    const totalPlanned = dailyPlans.reduce((sum, plan) => sum + plan.plannedHours, 0);
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
  }, [weeklyEntries, dailyPlans]);

  // Get today's goal and progress
  const todayData = useMemo(() => {
    const today = formatDate(new Date());
    const todayPlans = dailyPlans.filter(plan => plan.date === today);
    const todayEntries = weeklyEntries.filter(entry => entry.date === today);
    
    const planned = todayPlans.reduce((sum, plan) => sum + plan.plannedHours, 0);
    const completed = todayEntries.reduce((sum, entry) => sum + entry.actualHours, 0);
    const remaining = Math.max(0, planned - completed);
    
    return { planned, completed, remaining };
  }, [dailyPlans, weeklyEntries]);

  const dailyAverage = useMemo(() => {
    const daysWithEntries = new Set(weeklyEntries.map(entry => entry.date)).size;
    if (daysWithEntries === 0) return 0;
    return Math.round(progressData.totalActual / daysWithEntries);
  }, [weeklyEntries, progressData.totalActual]);

  const weekRange = useMemo(() => {
    return `${progressData.totalActual}/${progressData.totalPlanned} hours`;
  }, [progressData]);

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">This Week (Mon-Sun)</h2>
        <span className="text-sm text-gray-400">{weekRange}</span>
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
          <div className="text-gray-400">Remaining</div>
          <div className="font-semibold text-green-400">{progressData.remaining}h</div>
        </div>
        <div className="text-center">
          <div className="text-gray-400">Today Goal</div>
          <div className="font-semibold text-blue-400">
            {todayData.completed}/{todayData.planned}h completed
          </div>
        </div>
        <div className="text-center">
          <div className="text-gray-400">Average</div>
          <div className="font-semibold text-purple-400">{dailyAverage}h</div>
        </div>
      </div>
    </div>
  );
}
