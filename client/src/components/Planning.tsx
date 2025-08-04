import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { 
  getCategories, 
  getWeeklyGoals, 
  createWeeklyGoal, 
  updateWeeklyGoal,
  getDailyPlansByDateRange,
  createDailyPlan,
  updateDailyPlan,
} from "@/lib/storage";
import type { WeeklyGoal, DailyPlan } from "@shared/schema";

function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function getWeekDays(weekStart: string): { date: string; name: string; short: string }[] {
  const start = new Date(weekStart);
  const days = [];
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    
    days.push({
      date: formatDate(date),
      name: date.toLocaleDateString('en-US', { weekday: 'long' }),
      short: date.toLocaleDateString('en-US', { weekday: 'short' }),
    });
  }
  
  return days;
}

export default function Planning() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const weekStart = useMemo(() => getWeekStart(new Date()), []);
  const weekDays = useMemo(() => getWeekDays(weekStart), [weekStart]);

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });

  const { data: weeklyGoals = [] } = useQuery({
    queryKey: ["weekly-goals", weekStart],
    queryFn: () => getWeeklyGoals(weekStart),
  });

  const { data: dailyPlans = [] } = useQuery({
    queryKey: ["daily-plans", weekStart],
    queryFn: () => {
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      return getDailyPlansByDateRange(weekStart, formatDate(weekEnd));
    },
  });

  // Local state for goal values and daily plans
  const [goalValues, setGoalValues] = useState<Record<string, number>>({});
  const [dailyHours, setDailyHours] = useState<Record<string, Record<string, number>>>({});
  const [editingDay, setEditingDay] = useState<string | null>(null);

  // Initialize goal values and daily hours when data loads
  useEffect(() => {
    if (categories.length > 0) {
      const initialValues: Record<string, number> = {};
      const initialDaily: Record<string, Record<string, number>> = {};
      
      categories.forEach(category => {
        const existingGoal = weeklyGoals.find(g => g.categoryId === category.id);
        initialValues[category.id] = existingGoal?.targetHours || 0;
      });
      
      weekDays.forEach(day => {
        initialDaily[day.date] = {};
        categories.forEach(category => {
          const existingPlan = dailyPlans.find(
            p => p.date === day.date && p.categoryId === category.id
          );
          initialDaily[day.date][category.id] = existingPlan?.plannedHours || 0;
        });
      });
      
      setGoalValues(initialValues);
      setDailyHours(initialDaily);
    }
  }, [categories, weeklyGoals, dailyPlans, weekDays]);

  const totalWeeklyHours = useMemo(() => {
    return Object.values(goalValues).reduce((sum, hours) => sum + hours, 0);
  }, [goalValues]);

  // Get remaining days in the week (today and future)
  const remainingDays = useMemo(() => {
    const today = formatDate(new Date());
    return weekDays.filter(day => day.date >= today);
  }, [weekDays]);

  // Calculate if we should only distribute to remaining days
  const shouldDistributeToRemainingOnly = useMemo(() => {
    const today = formatDate(new Date());
    const todayIndex = weekDays.findIndex(day => day.date === today);
    return todayIndex > 0; // If today is not Monday, distribute only to remaining days
  }, [weekDays]);

  const savePlanningMutation = useMutation({
    mutationFn: async () => {
      const promises = categories.map(async (category) => {
        const targetHours = goalValues[category.id] || 0;
        const existingGoal = weeklyGoals.find(g => g.categoryId === category.id);
        
        if (existingGoal) {
          return updateWeeklyGoal(existingGoal.id, { targetHours });
        } else {
          return createWeeklyGoal({
            weekStart,
            categoryId: category.id,
            targetHours,
          });
        }
      });
      
      await Promise.all(promises);
      
      // Create daily plans using the custom daily hours or auto-distribution
      const dailyPromises = weekDays.flatMap(day => {
        return categories.map(async (category) => {
          const customHours = dailyHours[day.date]?.[category.id];
          let plannedHours = 0;
          
          if (customHours !== undefined && customHours > 0) {
            // Use custom hours if set
            plannedHours = customHours;
          } else {
            // Auto-distribute based on weekly goal and remaining days
            const weeklyTarget = goalValues[category.id] || 0;
            if (shouldDistributeToRemainingOnly) {
              const today = formatDate(new Date());
              if (day.date >= today) {
                // Distribute evenly among remaining days
                plannedHours = Math.round((weeklyTarget / remainingDays.length) * 10) / 10;
              } else {
                // Past days get 0 hours
                plannedHours = 0;
              }
            } else {
              // Distribute evenly across all 7 days
              plannedHours = Math.round((weeklyTarget / 7) * 10) / 10;
            }
          }
          
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
      
      await Promise.all(dailyPromises);
    },
    onSuccess: () => {
      toast({ title: "Planning saved successfully!" });
      queryClient.invalidateQueries({ queryKey: ["weekly-goals"] });
      queryClient.invalidateQueries({ queryKey: ["daily-plans"] });
      queryClient.invalidateQueries({ queryKey: ["current-week-data"] });
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

  const handleGoalChange = (categoryId: string, value: number) => {
    setGoalValues(prev => ({
      ...prev,
      [categoryId]: Math.max(0, Math.min(168, value)) // Max 168 hours per week
    }));
  };

  const handleDailyHourChange = (date: string, categoryId: string, hours: number) => {
    setDailyHours(prev => ({
      ...prev,
      [date]: {
        ...prev[date],
        [categoryId]: Math.max(0, Math.min(24, hours))
      }
    }));
  };

  const getDailyDistribution = (categoryId: string, date: string) => {
    // Check if there's a custom value for this day
    const customHours = dailyHours[date]?.[categoryId];
    if (customHours !== undefined && customHours > 0) {
      return customHours;
    }
    
    // Auto-calculate based on weekly goal and remaining days
    const weeklyHours = goalValues[categoryId] || 0;
    if (shouldDistributeToRemainingOnly) {
      const today = formatDate(new Date());
      if (date >= today) {
        return Math.round((weeklyHours / remainingDays.length) * 10) / 10;
      } else {
        return 0; // Past days get 0 hours
      }
    } else {
      return Math.round((weeklyHours / 7) * 10) / 10; // Distribute evenly across all days
    }
  };

  const getDayTotal = (date: string) => {
    return categories.reduce((total, category) => {
      return total + getDailyDistribution(category.id, date);
    }, 0);
  };

  return (
    <div className="p-4 space-y-6 pb-20">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Planning</h2>
        <button 
          className="text-study-blue font-medium disabled:opacity-50"
          onClick={() => savePlanningMutation.mutate()}
          disabled={savePlanningMutation.isPending}
        >
          {savePlanningMutation.isPending ? "Saving..." : "Save"}
        </button>
      </div>

      {/* Weekly Goals */}
      <div className="bg-dark-secondary rounded-2xl p-6">
        <h3 className="text-lg font-semibold mb-4">Weekly Goals</h3>
        
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
                <span className="font-medium">{category.name}</span>
              </div>
              <div className="flex items-center space-x-3">
                <input 
                  type="range" 
                  min="0" 
                  max="60" 
                  value={goalValues[category.id] || 0}
                  onChange={(e) => handleGoalChange(category.id, parseInt(e.target.value))}
                  className="w-24 h-2 bg-dark-tertiary rounded-lg appearance-none slider"
                />
                <span className="w-12 text-right font-medium">
                  {goalValues[category.id] || 0}h
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-dark-tertiary rounded-xl">
          <div className="flex justify-between text-sm">
            <span className="text-text-muted">Total Weekly Hours</span>
            <span className="font-semibold">{totalWeeklyHours}h</span>
          </div>
        </div>
      </div>

      {/* Daily Distribution */}
      <div className="bg-dark-secondary rounded-2xl p-6">
        <h3 className="text-lg font-semibold mb-4">Daily Distribution</h3>
        
        <div className="space-y-3">
          {weekDays.map((day) => {
            const today = formatDate(new Date());
            const isPastDay = day.date < today;
            const dayTotal = getDayTotal(day.date);
            
            return (
              <div key={day.date}>
                <button
                  className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                    isPastDay 
                      ? 'bg-dark-tertiary/50 opacity-60' 
                      : 'bg-dark-tertiary hover:bg-opacity-80'
                  }`}
                  onClick={() => !isPastDay && setEditingDay(day.date)}
                  disabled={isPastDay}
                >
                  <div className="flex items-center space-x-3">
                    <span className="font-medium w-20">{day.name}</span>
                    {isPastDay && <span className="text-xs text-text-muted">(past)</span>}
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      {categories.map((category) => (
                        <div key={category.id} className="flex items-center space-x-1">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: category.color }}
                          ></div>
                          <span className="text-sm w-8">
                            {getDailyDistribution(category.id, day.date)}h
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-text-muted">Total: {Math.round(dayTotal * 10) / 10}h</span>
                      {!isPastDay && <i className="fas fa-edit text-xs text-text-muted"></i>}
                    </div>
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Daily Edit Modal */}
      {editingDay && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-dark-secondary rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">
                Edit {weekDays.find(d => d.date === editingDay)?.name}
              </h3>
              <button 
                onClick={() => setEditingDay(null)}
                className="w-8 h-8 bg-dark-tertiary rounded-full flex items-center justify-center"
              >
                <i className="fas fa-times text-text-muted"></i>
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
                    <span className="font-medium">{category.name}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button 
                      className="w-8 h-8 bg-dark-tertiary rounded-full flex items-center justify-center"
                      onClick={() => handleDailyHourChange(
                        editingDay, 
                        category.id, 
                        Math.max(0, (dailyHours[editingDay]?.[category.id] || getDailyDistribution(category.id, editingDay)) - 0.5)
                      )}
                    >
                      <i className="fas fa-minus text-text-muted text-xs"></i>
                    </button>
                    <input 
                      type="number" 
                      value={dailyHours[editingDay]?.[category.id] !== undefined 
                        ? dailyHours[editingDay][category.id] 
                        : getDailyDistribution(category.id, editingDay)}
                      onChange={(e) => handleDailyHourChange(
                        editingDay, 
                        category.id, 
                        parseFloat(e.target.value) || 0
                      )}
                      min="0" 
                      max="24" 
                      step="0.5"
                      className="w-16 h-8 bg-dark-tertiary rounded text-center text-sm border-none outline-none"
                    />
                    <button 
                      className="w-8 h-8 bg-dark-tertiary rounded-full flex items-center justify-center"
                      onClick={() => handleDailyHourChange(
                        editingDay, 
                        category.id, 
                        Math.min(24, (dailyHours[editingDay]?.[category.id] || getDailyDistribution(category.id, editingDay)) + 0.5)
                      )}
                    >
                      <i className="fas fa-plus text-text-muted text-xs"></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 p-3 bg-dark-tertiary rounded-lg">
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Total for {weekDays.find(d => d.date === editingDay)?.name}</span>
                <span className="font-semibold">{Math.round(getDayTotal(editingDay) * 10) / 10}h</span>
              </div>
            </div>
            
            <button 
              className="w-full mt-4 bg-study-blue text-white py-3 rounded-lg font-medium"
              onClick={() => setEditingDay(null)}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
