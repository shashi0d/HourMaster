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
  // Use timezone-safe date formatting
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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

  // Debug logging
  console.log('Analytics - weekData:', weekData);
  console.log('Analytics - weekData?.entries:', weekData?.entries);

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
    
    return {
      categoryTotals,
      dailyAverage,
      bestDayName,
      totalHours,
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
    <div className="p-4 space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white mb-1">Analytics</h1>
          <p className="text-xs text-gray-400">Track your progress and insights</p>
        </div>
        <button 
          className="bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          onClick={handleExportCSV}
        >
          <i className="fas fa-download text-blue-400 text-sm"></i>
          <span className="text-sm font-medium text-white">Export</span>
        </button>
      </div>

      {/* Weekly Chart */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-white mb-1">This Week</h2>
          <p className="text-xs text-gray-400">Daily breakdown by category</p>
        </div>
        
        <div className="space-y-3">
          {weeklyChartData.map((day, index) => (
            <div key={day.date} className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-300 w-10">{day.short}</span>
              <div className="flex-1 mx-3">
                <div className="h-4 bg-gray-700 rounded-full overflow-hidden flex">
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
              <span className="text-xs text-gray-400 w-8 text-right">{day.total}h</span>
            </div>
          ))}
        </div>

        <div className="flex justify-between mt-4 pt-3 border-t border-gray-700">
          {weeklyTotals.map(({ category, total }) => (
            <div key={category.id} className="text-center">
              <div className="flex items-center justify-center space-x-1 mb-1">
                <div 
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: category.color }}
                ></div>
                <span className="text-xs text-gray-400">{category.name}</span>
              </div>
              <div className="text-sm font-semibold text-white">{total}h</div>
            </div>
          ))}
        </div>
      </div>

      {/* Monthly Overview */}
      {monthlyStats && (
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-white mb-1">Monthly Overview</h2>
            <p className="text-xs text-gray-400">August 2024 summary</p>
          </div>
          
          <div className="grid grid-cols-3 gap-4 mb-4">
            {monthlyStats.categoryTotals.map(({ category, total }) => (
              <div key={category.id} className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center mr-2"
                    style={{ backgroundColor: category.color }}
                  >
                    <i className={`${category.icon} text-white text-sm`}></i>
                  </div>
                </div>
                <div 
                  className="text-lg font-bold"
                  style={{ color: category.color }}
                >
                  {total}h
                </div>
                <div className="text-xs text-gray-400">{category.name}</div>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-400">Daily Average</span>
              <span className="text-sm font-medium text-white">{monthlyStats.dailyAverage}h</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-400">Most Productive Day</span>
              <span className="text-sm font-medium text-green-400">{monthlyStats.bestDayName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-400">Total Hours</span>
              <span className="text-sm font-medium text-blue-400">{monthlyStats.totalHours}h</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
