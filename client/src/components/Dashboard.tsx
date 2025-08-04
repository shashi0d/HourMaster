import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useMemo } from "react";
import WeeklyProgress from "./WeeklyProgress";
import { 
  getCategories, 
  getTimeEntries, 
  getWeeklyGoals, 
  getCurrentWeekData 
} from "@/lib/storage";
import type { Category, TimeEntry } from "@shared/schema";

function CategoryCard({ 
  category, 
  planned, 
  completed, 
  remaining 
}: { 
  category: Category; 
  planned: number; 
  completed: number; 
  remaining: number;
}) {
  const isComplete = remaining === 0;
  
  return (
    <div className="category-card bg-dark-secondary rounded-xl p-4 flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <div 
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: category.color }}
        >
          <i className={`${category.icon} text-white text-lg`}></i>
        </div>
        <div>
          <h4 className="font-medium">{category.name}</h4>
          <p className="text-sm text-text-muted">
            <span>{completed}h</span> of <span>{planned}h</span>
          </p>
        </div>
      </div>
      <div className="text-right">
        <div className={`text-lg font-semibold ${isComplete ? 'text-workout-green' : ''}`}>
          {remaining}h
        </div>
        <div className="text-xs text-text-muted">
          {isComplete ? 'complete' : 'remaining'}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [, setLocation] = useLocation();

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });

  const { data: weekData } = useQuery({
    queryKey: ["current-week-data"],
    queryFn: getCurrentWeekData,
  });

  const todayData = useMemo(() => {
    if (!weekData || !categories.length) return [];
    
    const today = new Date().toISOString().split('T')[0];
    const todayEntries = weekData.entries.filter(entry => entry.date === today);
    
    return categories.map(category => {
      const entry = todayEntries.find(e => e.categoryId === category.id);
      const planned = entry?.plannedHours || 0;
      const completed = entry?.actualHours || 0;
      const remaining = Math.max(0, planned - completed);
      
      return {
        category,
        planned,
        completed,
        remaining,
      };
    });
  }, [weekData, categories]);

  const currentDate = useMemo(() => {
    return new Date().toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'short', 
      day: 'numeric' 
    });
  }, []);

  return (
    <div className="p-4 space-y-6 pb-20">
      {/* Header */}
      <header className="bg-dark-secondary px-4 py-4 flex items-center justify-between rounded-2xl">
        <div>
          <h1 className="text-xl font-semibold">TimeTracker</h1>
          <p className="text-sm text-text-muted">{currentDate}</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="w-10 h-10 bg-dark-tertiary rounded-full flex items-center justify-center">
            <i className="fas fa-bell text-text-muted"></i>
          </button>
          <div className="w-10 h-10 bg-gradient-to-br from-study-blue to-sleep-purple rounded-full flex items-center justify-center">
            <span className="text-sm font-medium">JD</span>
          </div>
        </div>
      </header>

      {/* Weekly Progress */}
      {weekData && (
        <WeeklyProgress
          categories={categories}
          weeklyEntries={weekData.entries}
          weeklyGoals={weekData.goals}
        />
      )}

      {/* Today's Categories */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold px-2">Today's Allocation</h3>
        
        {todayData.map(({ category, planned, completed, remaining }) => (
          <CategoryCard
            key={category.id}
            category={category}
            planned={planned}
            completed={completed}
            remaining={remaining}
          />
        ))}
      </div>

      {/* Quick Actions */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold px-2">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-3">
          <button 
            className="bg-dark-secondary rounded-xl p-4 text-left"
            onClick={() => setLocation("/planning")}
          >
            <div className="w-10 h-10 bg-study-blue/20 rounded-lg flex items-center justify-center mb-3">
              <i className="fas fa-calendar-plus text-study-blue"></i>
            </div>
            <h4 className="font-medium mb-1">Plan Week</h4>
            <p className="text-sm text-text-muted">Allocate hours</p>
          </button>
          
          <button 
            className="bg-dark-secondary rounded-xl p-4 text-left"
            onClick={() => setLocation("/entry")}
          >
            <div className="w-10 h-10 bg-workout-green/20 rounded-lg flex items-center justify-center mb-3">
              <i className="fas fa-plus text-workout-green"></i>
            </div>
            <h4 className="font-medium mb-1">Log Hours</h4>
            <p className="text-sm text-text-muted">End of day entry</p>
          </button>
        </div>
      </div>
    </div>
  );
}
