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

  // Local state for goal values
  const [goalValues, setGoalValues] = useState<Record<string, number>>({});

  // Initialize goal values when data loads
  useEffect(() => {
    if (categories.length > 0) {
      const initialValues: Record<string, number> = {};
      categories.forEach(category => {
        const existingGoal = weeklyGoals.find(g => g.categoryId === category.id);
        initialValues[category.id] = existingGoal?.targetHours || 0;
      });
      setGoalValues(initialValues);
    }
  }, [categories, weeklyGoals]);

  const totalWeeklyHours = useMemo(() => {
    return Object.values(goalValues).reduce((sum, hours) => sum + hours, 0);
  }, [goalValues]);

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
      
      // Create daily plans based on weekly goals
      const dailyPromises = categories.flatMap(category => {
        const weeklyTarget = goalValues[category.id] || 0;
        const dailyTarget = Math.round(weeklyTarget / 7 * 10) / 10; // Round to 1 decimal
        
        return weekDays.map(async (day) => {
          const existingPlan = dailyPlans.find(
            p => p.date === day.date && p.categoryId === category.id
          );
          
          if (existingPlan) {
            return updateDailyPlan(existingPlan.id, { plannedHours: dailyTarget });
          } else {
            return createDailyPlan({
              date: day.date,
              categoryId: category.id,
              plannedHours: dailyTarget,
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

  const getDailyDistribution = (categoryId: string) => {
    const weeklyHours = goalValues[categoryId] || 0;
    return Math.round(weeklyHours / 7 * 10) / 10; // Round to 1 decimal
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
          {weekDays.map((day) => (
            <div key={day.date} className="flex items-center justify-between p-3 bg-dark-tertiary rounded-lg">
              <span className="font-medium">{day.name}</span>
              <div className="flex items-center space-x-2">
                {categories.map((category) => (
                  <div key={category.id} className="flex items-center space-x-1">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: category.color }}
                    ></div>
                    <span className="text-sm w-8">
                      {getDailyDistribution(category.id)}h
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
