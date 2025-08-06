import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useMemo } from "react";
import WeeklyProgress from "./WeeklyProgress";
import { 
  getCategories, 
  getTimeEntries, 
  getWeeklyGoals, 
  getDailyPlans,
  getCurrentWeekData 
} from "@/lib/storage";
import type { Category, TimeEntry } from "@shared/schema";

// Timezone-safe date formatting
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

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
  const isComplete = remaining === 0 && planned > 0;
  
  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 flex items-center justify-between border border-gray-700/50">
      <div className="flex items-center space-x-3">
        <div 
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: category.color }}
        >
          <i className={`${category.icon} text-white text-lg`}></i>
        </div>
        <div>
          <h4 className="font-medium text-white">{category.name}</h4>
          <p className="text-sm text-gray-400">
            <span>{completed}h</span> of <span>{planned}h</span>
          </p>
        </div>
      </div>
      <div className="text-right">
        {isComplete ? (
          <div className="flex items-center space-x-2">
            <i className="fas fa-check-circle text-green-400 text-lg"></i>
            <div className="text-green-400 font-semibold">Completed</div>
          </div>
        ) : (
          <>
            <div className="text-lg font-semibold text-white">
              {remaining}h
            </div>
            <div className="text-xs text-gray-400">
              remaining
            </div>
          </>
        )}
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

  // Use weekData for today's data instead of separate queries
  const todayData = useMemo(() => {
    if (!categories.length || !weekData) return [];
    
    const today = formatDate(new Date());
    const todayPlans = weekData.plans.filter(p => p.date === today);
    const todayEntries = weekData.entries.filter(e => e.date === today);
    
    return categories.map(category => {
      const entry = todayEntries.find(e => e.categoryId === category.id);
      const plan = todayPlans.find(p => p.categoryId === category.id);
      
      const planned = plan?.plannedHours || 0;
      const completed = entry?.actualHours || 0;
      const remaining = Math.max(0, planned - completed);
      
      return {
        category,
        planned,
        completed,
        remaining,
      };
    });
  }, [categories, weekData]);

  const currentDate = useMemo(() => {
    return new Date().toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'short', 
      day: 'numeric' 
    });
  }, []);

  return (
    <div className="p-4 space-y-6 pb-24">
      {/* Header */}
      <header className="bg-gray-800/50 backdrop-blur-sm px-4 py-4 flex items-center justify-between rounded-2xl border border-gray-700/50">
        <div>
          <h1 className="text-xl font-bold text-white mb-1">H-logs</h1>
          <p className="text-xs text-gray-400">{currentDate}</p>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            className="w-10 h-10 bg-gray-700 hover:bg-gray-600 rounded-full flex items-center justify-center transition-colors"
            onClick={() => setLocation("/settings")}
          >
            <i className="fas fa-cog text-gray-300"></i>
          </button>
        </div>
      </header>

      {/* Weekly Progress */}
      {weekData && (
        <WeeklyProgress
          categories={categories}
          weeklyEntries={weekData.entries}
          weeklyGoals={weekData.goals}
          dailyPlans={weekData.plans}
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
        <h3 className="text-lg font-semibold text-white px-2">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-3">
          <button 
            className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 text-left border border-gray-700/50 hover:bg-gray-800/70 transition-colors"
            onClick={() => setLocation("/planning")}
          >
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center mb-3">
              <i className="fas fa-calendar-plus text-blue-400"></i>
            </div>
            <h4 className="font-medium text-white mb-1">Plan Week</h4>
            <p className="text-sm text-gray-400">Allocate hours</p>
          </button>
          
          <button 
            className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 text-left border border-gray-700/50 hover:bg-gray-800/70 transition-colors"
            onClick={() => setLocation("/entry")}
          >
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center mb-3">
              <i className="fas fa-plus text-green-400"></i>
            </div>
            <h4 className="font-medium text-white mb-1">Log Hours</h4>
            <p className="text-sm text-gray-400">End of day entry</p>
          </button>
        </div>
      </div>
    </div>
  );
}
