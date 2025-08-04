import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  getCategories, 
  getCurrentWeekData, 
  getCurrentMonthData,
  exportAllData
} from "@/lib/storage";
import { saveAs } from 'file-saver';
import Papa from 'papaparse';

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

export default function Analytics() {
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });

  const { data: weekData } = useQuery({
    queryKey: ["current-week-data"],
    queryFn: getCurrentWeekData,
  });

  const { data: monthData } = useQuery({
    queryKey: ["current-month-data"],
    queryFn: getCurrentMonthData,
  });

  const weekDays = useMemo(() => {
    if (!weekData) return [];
    return getWeekDays(weekData.weekStart);
  }, [weekData]);

  const weeklyChartData = useMemo(() => {
    if (!weekData || !categories.length) return [];
    
    return weekDays.map(day => {
      const dayEntries = weekData.entries.filter(entry => entry.date === day.date);
      const categoryHours = categories.map(category => {
        const entry = dayEntries.find(e => e.categoryId === category.id);
        return entry?.actualHours || 0;
      });
      
      const total = categoryHours.reduce((sum, hours) => sum + hours, 0);
      const percentages = total > 0 ? categoryHours.map(hours => (hours / total) * 100) : [0, 0, 0];
      
      return {
        ...day,
        categoryHours,
        total: Math.round(total * 10) / 10,
        percentages,
      };
    });
  }, [weekData, categories, weekDays]);

  const weeklyTotals = useMemo(() => {
    if (!weekData || !categories.length) return [];
    
    return categories.map(category => {
      const total = weekData.entries
        .filter(entry => entry.categoryId === category.id)
        .reduce((sum, entry) => sum + entry.actualHours, 0);
      
      return {
        category,
        total: Math.round(total * 10) / 10,
      };
    });
  }, [weekData, categories]);

  const monthlyStats = useMemo(() => {
    if (!monthData || !categories.length) return null;
    
    const categoryTotals = categories.map(category => {
      const total = monthData.entries
        .filter(entry => entry.categoryId === category.id)
        .reduce((sum, entry) => sum + entry.actualHours, 0);
      return { category, total: Math.round(total * 10) / 10 };
    });
    
    const totalHours = categoryTotals.reduce((sum, cat) => sum + cat.total, 0);
    const daysInMonth = monthData.entries.length > 0 
      ? new Set(monthData.entries.map(e => e.date)).size 
      : 0;
    const dailyAverage = daysInMonth > 0 ? Math.round((totalHours / daysInMonth) * 10) / 10 : 0;
    
    // Find most productive day
    const dailyTotals = monthData.entries.reduce((acc, entry) => {
      acc[entry.date] = (acc[entry.date] || 0) + entry.actualHours;
      return acc;
    }, {} as Record<string, number>);
    
    const bestDay = Object.entries(dailyTotals).reduce((best, [date, hours]) => {
      return hours > best.hours ? { date, hours } : best;
    }, { date: '', hours: 0 });
    
    const bestDayName = bestDay.date 
      ? new Date(bestDay.date).toLocaleDateString('en-US', { weekday: 'long' })
      : 'N/A';
    
    // Calculate goal achievement (assuming 75% as baseline)
    const goalPercent = Math.min(100, Math.round((totalHours / (daysInMonth * 12)) * 100));
    
    return {
      categoryTotals,
      dailyAverage,
      bestDayName,
      goalPercent,
    };
  }, [monthData, categories]);

  const handleExportCSV = async () => {
    try {
      const data = await exportAllData();
      
      // Prepare data for CSV export
      const csvData = data.timeEntries.map(entry => {
        const category = categories.find(c => c.id === entry.categoryId);
        return {
          Date: entry.date,
          Category: category?.name || 'Unknown',
          'Planned Hours': entry.plannedHours,
          'Actual Hours': entry.actualHours,
          'Created At': entry.createdAt,
        };
      });
      
      const csv = Papa.unparse(csvData);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const filename = `time-tracker-export-${new Date().toISOString().split('T')[0]}.csv`;
      
      saveAs(blob, filename);
    } catch (error) {
      console.error('Failed to export CSV:', error);
    }
  };

  return (
    <div className="p-4 space-y-6 pb-20">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Analytics</h2>
        <button 
          className="bg-dark-secondary px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-opacity-80 transition-colors"
          onClick={handleExportCSV}
        >
          <i className="fas fa-download text-study-blue"></i>
          <span className="font-medium">Export CSV</span>
        </button>
      </div>

      {/* Weekly Chart */}
      <div className="bg-dark-secondary rounded-2xl p-6">
        <h3 className="text-lg font-semibold mb-4">This Week</h3>
        
        <div className="space-y-4">
          {weeklyChartData.map((day, index) => (
            <div key={day.date} className="flex items-center justify-between">
              <span className="text-sm font-medium w-12">{day.short}</span>
              <div className="flex-1 mx-4">
                <div className="h-6 bg-dark-tertiary rounded-full overflow-hidden flex">
                  {day.percentages.map((percentage, catIndex) => (
                    <div 
                      key={catIndex}
                      className="h-full transition-all duration-300"
                      style={{ 
                        backgroundColor: categories[catIndex]?.color || '#666',
                        width: `${percentage}%`
                      }}
                    ></div>
                  ))}
                </div>
              </div>
              <span className="text-sm text-text-muted w-8 text-right">{day.total}h</span>
            </div>
          ))}
        </div>

        <div className="flex justify-between mt-6 pt-4 border-t border-dark-tertiary">
          {weeklyTotals.map(({ category, total }) => (
            <div key={category.id} className="text-center">
              <div className="flex items-center justify-center space-x-1 mb-1">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: category.color }}
                ></div>
                <span className="text-sm text-text-muted">{category.name}</span>
              </div>
              <div className="font-semibold">{total}h</div>
            </div>
          ))}
        </div>
      </div>

      {/* Monthly Overview */}
      {monthlyStats && (
        <div className="bg-dark-secondary rounded-2xl p-6">
          <h3 className="text-lg font-semibold mb-4">Monthly Overview</h3>
          
          <div className="grid grid-cols-3 gap-4 mb-6">
            {monthlyStats.categoryTotals.map(({ category, total }) => (
              <div key={category.id} className="text-center">
                <div 
                  className="text-2xl font-bold"
                  style={{ color: category.color }}
                >
                  {total}h
                </div>
                <div className="text-sm text-text-muted">{category.name}</div>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-text-muted">Daily Average</span>
              <span className="font-medium">{monthlyStats.dailyAverage}h</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Most Productive Day</span>
              <span className="font-medium text-workout-green">{monthlyStats.bestDayName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Goal Achievement</span>
              <span className="font-medium text-study-blue">{monthlyStats.goalPercent}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Insights */}
      <div className="bg-dark-secondary rounded-2xl p-6">
        <h3 className="text-lg font-semibold mb-4">Insights</h3>
        
        <div className="space-y-3">
          <div className="flex items-start space-x-3 p-3 bg-study-blue/10 rounded-lg">
            <div className="w-8 h-8 bg-study-blue/20 rounded-full flex items-center justify-center mt-1">
              <i className="fas fa-lightbulb text-study-blue text-sm"></i>
            </div>
            <div>
              <p className="text-sm">Track consistently across all categories to get better insights and maintain healthy habits.</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3 p-3 bg-workout-green/10 rounded-lg">
            <div className="w-8 h-8 bg-workout-green/20 rounded-full flex items-center justify-center mt-1">
              <i className="fas fa-trending-up text-workout-green text-sm"></i>
            </div>
            <div>
              <p className="text-sm">Great job maintaining your tracking habit! Consistency is key to achieving your goals.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
