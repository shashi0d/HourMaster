import { useState, useMemo, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { 
  getCategories, 
  getDailyPlansByDateRange, 
  createDailyPlan, 
  updateDailyPlan 
} from "@/lib/storage";
import type { Category, DailyPlan } from "@shared/schema";

// Simple date formatting
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Get Monday of the current week
function getMondayOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  // If it's Sunday (day = 0), we go back 6 days to get to Monday
  // If it's any other day, we go back (day - 1) days to get to Monday
  const diff = d.getDate() - (day === 0 ? 6 : day - 1);
  d.setDate(diff);
  return d;
}

// Get week days (Monday to Sunday)
function getWeekDays(monday: Date): { date: string; name: string; displayDate: string }[] {
  const days = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    
    days.push({
      date: formatDate(date),
      name: date.toLocaleDateString('en-US', { weekday: 'long' }),
      displayDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    });
  }
  return days;
}

export default function Planning() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Week navigation
  const [weekOffset, setWeekOffset] = useState(0);
  
  // Calculate current week's Monday
  const currentMonday = useMemo(() => {
    const today = new Date();
    const monday = getMondayOfWeek(today);
    monday.setDate(monday.getDate() + (weekOffset * 7));
    return monday;
  }, [weekOffset]);

  // Get week days
  const weekDays = useMemo(() => getWeekDays(currentMonday), [currentMonday]);

  // Week range display
  const weekRange = useMemo(() => {
    const start = currentMonday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const end = new Date(currentMonday);
    end.setDate(end.getDate() + 6);
    const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${start} - ${endStr} (Mon-Sun)`;
  }, [currentMonday]);

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });

  // Fetch daily plans for the week
  const weekStart = formatDate(currentMonday);
  const weekEnd = formatDate(new Date(currentMonday.getTime() + 6 * 24 * 60 * 60 * 1000));
  
  const { data: dailyPlans = [] } = useQuery({
    queryKey: ["daily-plans", weekStart],
    queryFn: () => getDailyPlansByDateRange(weekStart, weekEnd),
  });

  // Local state for daily hours
  const [dailyHours, setDailyHours] = useState<Record<string, Record<string, number>>>({});
  const [editingDay, setEditingDay] = useState<string | null>(null);

  // Initialize daily hours when data loads
  useEffect(() => {
    if (categories.length > 0) {
      const initial: Record<string, Record<string, number>> = {};
      
      weekDays.forEach(day => {
        initial[day.date] = {};
        categories.forEach(category => {
          const existingPlan = dailyPlans.find(
            p => p.date === day.date && p.categoryId === category.id
          );
          initial[day.date][category.id] = existingPlan?.plannedHours || category.defaultHours || 0;
        });
      });
      
      setDailyHours(initial);
    }
  }, [categories, dailyPlans, weekDays]);

  // Calculate total weekly hours
  const totalWeeklyHours = useMemo(() => {
    let total = 0;
    weekDays.forEach(day => {
      categories.forEach(category => {
        total += dailyHours[day.date]?.[category.id] || 0;
      });
    });
    return Math.round(total * 10) / 10;
  }, [dailyHours, weekDays, categories]);

  // Save planning mutation
  const savePlanningMutation = useMutation({
    mutationFn: async () => {
      const promises = weekDays.flatMap(day => {
        return categories.map(async (category) => {
          const plannedHours = dailyHours[day.date]?.[category.id] || 0;
          
          const existingPlan = dailyPlans.find(
            p => p.date === day.date && p.categoryId === category.id
          );
          
          if (existingPlan) {
            return updateDailyPlan(existingPlan.id, { plannedHours });
          } else {
            return createDailyPlan({
              date: day.date,
              categoryId: category.id,
              plannedHours,
            });
          }
        });
      });
      
      await Promise.all(promises);
    },
    onSuccess: () => {
      toast({ title: "Planning saved successfully!" });
      // Invalidate all related queries to ensure data consistency
      queryClient.invalidateQueries({ queryKey: ["daily-plans"] });
      queryClient.invalidateQueries({ queryKey: ["current-week-data"] });
      queryClient.invalidateQueries({ queryKey: ["time-entries"] });
      // Also invalidate specific week queries
      queryClient.invalidateQueries({ queryKey: ["daily-plans", weekStart] });
      setLocation("/");
    },
    onError: (error) => {
      toast({ 
        title: "Failed to save planning", 
        description: error.message,
        variant: "destructive"
      });
    },
  });

  // Handle hour changes
  const handleHourChange = (date: string, categoryId: string, hours: number) => {
    setDailyHours(prev => ({
      ...prev,
      [date]: {
        ...prev[date],
        [categoryId]: Math.max(0, Math.min(24, hours))
      }
    }));
  };

  // Get day total
  const getDayTotal = (date: string) => {
    return categories.reduce((total, category) => {
      return total + (dailyHours[date]?.[category.id] || 0);
    }, 0);
  };

  const isCurrentWeek = weekOffset === 0;
  const today = formatDate(new Date());

  return (
    <div className="p-4 space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white mb-1">Planning</h1>
          <p className="text-xs text-gray-400">Allocate hours for each day</p>
        </div>
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => setWeekOffset(prev => prev - 1)}
            className="w-8 h-8 bg-gray-700 hover:bg-gray-600 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95"
          >
            <i className="fas fa-chevron-left text-gray-300 text-xs"></i>
          </button>
          <div className="text-center min-w-[120px]">
            <div className="text-xs font-medium text-white">{weekRange}</div>
            {isCurrentWeek && (
              <div className="text-xs text-blue-400 font-medium">Current Week</div>
            )}
          </div>
          <button 
            onClick={() => setWeekOffset(prev => prev + 1)}
            className="w-8 h-8 bg-gray-700 hover:bg-gray-600 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95"
          >
            <i className="fas fa-chevron-right text-gray-300 text-xs"></i>
          </button>
        </div>
      </div>
      
      <div className="space-y-3">
        {weekDays.map((day) => {
          const isPastDay = day.date < today;
          const isToday = day.date === today;
          const dayTotal = getDayTotal(day.date);
          
          return (
            <div key={day.date}>
              <button
                className={`w-full flex items-center justify-between p-4 rounded-xl transition-all duration-200 ${
                  isPastDay 
                    ? 'bg-gray-700/30 opacity-60 cursor-not-allowed' 
                    : isToday
                    ? 'bg-blue-500/20 border border-blue-500/30 hover:bg-blue-500/30'
                    : 'bg-gray-700/50 hover:bg-gray-700/70 border border-gray-600/30 hover:border-gray-500/50'
                }`}
                onClick={() => !isPastDay && setEditingDay(day.date)}
                disabled={isPastDay}
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <div className="text-left flex-shrink-0">
                    <div className={`font-semibold text-sm ${isToday ? 'text-blue-300' : 'text-white'}`}>
                      {day.name}
                      {isToday && <span className="ml-1 text-xs bg-blue-500 text-white px-1.5 py-0.5 rounded-full">Today</span>}
                    </div>
                    <div className="text-xs text-gray-400">{day.displayDate}</div>
                  </div>
                  {isPastDay && (
                    <span className="text-xs text-gray-500 bg-gray-600 px-1.5 py-0.5 rounded-full flex-shrink-0">Past</span>
                  )}
                </div>
                <div className="flex items-center space-x-2 flex-shrink-0">
                  <div className="hidden sm:flex items-center space-x-3">
                    {categories.map((category) => (
                      <div key={category.id} className="flex items-center space-x-1.5">
                        <div 
                          className="w-3 h-3 rounded-full shadow-sm"
                          style={{ backgroundColor: category.color }}
                        ></div>
                        <span className="text-xs font-medium text-gray-300 w-8 text-right">
                          {dailyHours[day.date]?.[category.id] || 0}h
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="text-right">
                      <div className="text-xs text-gray-400">Total</div>
                      <div className="text-sm font-bold text-white">{Math.round(dayTotal * 10) / 10}h</div>
                    </div>
                    {!isPastDay && (
                      <div className="w-6 h-6 bg-gray-600 hover:bg-gray-500 rounded-lg flex items-center justify-center transition-colors">
                        <i className="fas fa-edit text-gray-400 text-xs"></i>
                      </div>
                    )}
                  </div>
                </div>
              </button>
            </div>
          );
        })}
      </div>
      
      <div className="mt-6 p-4 bg-gradient-to-r from-gray-700/50 to-gray-600/50 rounded-xl border border-gray-600/30">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-400 mb-1">Weekly Summary</div>
            <div className="text-lg font-bold text-white">{totalWeeklyHours}h</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-400">Total Planned</div>
            <div className="text-sm font-semibold text-green-400">This Week</div>
          </div>
        </div>
      </div>

      {/* Edit Day Modal */}
      {editingDay && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-sm border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">
                Edit {weekDays.find(d => d.date === editingDay)?.name}
              </h3>
              <button 
                onClick={() => setEditingDay(null)}
                className="w-8 h-8 bg-gray-700 hover:bg-gray-600 rounded-lg flex items-center justify-center transition-colors"
              >
                <i className="fas fa-times text-gray-300 text-sm"></i>
              </button>
            </div>
            
            <div className="space-y-4">
              {categories.map((category) => (
                <div key={category.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: category.color }}
                    >
                      <i className={`${category.icon} text-white text-sm`}></i>
                    </div>
                    <span className="font-medium text-white text-sm">{category.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button 
                      className="w-8 h-8 bg-gray-700 hover:bg-gray-600 rounded-lg flex items-center justify-center transition-colors"
                      onClick={() => handleHourChange(
                        editingDay, 
                        category.id, 
                        Math.max(0, (dailyHours[editingDay]?.[category.id] || 0) - 0.5)
                      )}
                    >
                      <i className="fas fa-minus text-gray-300 text-xs"></i>
                    </button>
                    <input 
                      type="number" 
                      value={dailyHours[editingDay]?.[category.id] || 0}
                      onChange={(e) => handleHourChange(
                        editingDay, 
                        category.id, 
                        parseFloat(e.target.value) || 0
                      )}
                      min="0" 
                      max="24" 
                      step="0.5"
                      className="w-16 h-8 bg-gray-700 rounded-lg text-center text-sm border-none outline-none text-white"
                    />
                    <button 
                      className="w-8 h-8 bg-gray-700 hover:bg-gray-600 rounded-lg flex items-center justify-center transition-colors"
                      onClick={() => handleHourChange(
                        editingDay, 
                        category.id, 
                        Math.min(24, (dailyHours[editingDay]?.[category.id] || 0) + 0.5)
                      )}
                    >
                      <i className="fas fa-plus text-gray-300 text-xs"></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 p-3 bg-gray-700/50 rounded-lg">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Total for {weekDays.find(d => d.date === editingDay)?.name}</span>
                <span className="font-semibold text-white">{Math.round(getDayTotal(editingDay) * 10) / 10}h</span>
              </div>
            </div>
            
            <button 
              className="w-full mt-4 bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-medium transition-colors"
              onClick={() => setEditingDay(null)}
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Save Button */}
      <button
        onClick={() => savePlanningMutation.mutate()}
        disabled={savePlanningMutation.isPending}
        className="mx-auto bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white py-4 px-6 rounded-xl font-semibold flex items-center justify-center space-x-2 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/25"
      >
        {savePlanningMutation.isPending ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>Saving...</span>
          </>
        ) : (
          <>
            <i className="fas fa-save text-lg"></i>
            <span>Save Planning</span>
          </>
        )}
      </button>
    </div>
  );
}



