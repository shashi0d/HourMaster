import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { 
  getCategories, 
  getTimeEntries, 
  getDailyPlans,
  createTimeEntry, 
  updateTimeEntry 
} from "@/lib/storage";
import type { TimeEntry } from "@shared/schema";

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  // If it's Sunday (day = 0), we go back 6 days to get to Monday
  // If it's any other day, we go back (day - 1) days to get to Monday
  const diff = d.getDate() - (day === 0 ? 6 : day - 1);
  d.setDate(diff);
  
  // Use timezone-safe date formatting
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const dayOfMonth = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${dayOfMonth}`;
}

export default function Entry() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedDate, setSelectedDate] = useState(() => formatDate(new Date()));
  
  const selectedDateFormatted = useMemo(() => {
    // Parse the date string properly to avoid timezone issues
    const [year, month, day] = selectedDate.split('-').map(Number);
    const date = new Date(year, month - 1, day); // month is 0-indexed
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  }, [selectedDate]);

  // Get last 30 days for date selection
  const availableDates = useMemo(() => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      dates.push({
        value: formatDate(date),
        label: date.toLocaleDateString('en-US', { 
          weekday: 'short',
          month: 'short', 
          day: 'numeric' 
        }),
        isToday: i === 0
      });
    }
    return dates;
  }, []);

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });

  const { data: selectedEntries = [] } = useQuery({
    queryKey: ["time-entries", selectedDate],
    queryFn: () => getTimeEntries(selectedDate),
  });

  const { data: selectedPlans = [], refetch: refetchPlans } = useQuery({
    queryKey: ["daily-plans", selectedDate],
    queryFn: () => getDailyPlans(selectedDate),
    refetchOnWindowFocus: false,
    staleTime: 0, // Always fetch fresh data when date changes
  });

  // Refetch plans when date changes
  useEffect(() => {
    refetchPlans();
  }, [selectedDate, refetchPlans]);

  // Local state for actual hours
  const [actualHours, setActualHours] = useState<Record<string, number>>({});

  // Initialize actual hours when data loads or date changes
  useEffect(() => {
    if (categories.length > 0) {
      const initialValues: Record<string, number> = {};
      categories.forEach(category => {
        const existingEntry = selectedEntries.find(e => e.categoryId === category.id);
        initialValues[category.id] = existingEntry?.actualHours || 0;
      });
      setActualHours(initialValues);
    }
  }, [categories, selectedEntries, selectedDate]);

  const saveEntryMutation = useMutation({
    mutationFn: async () => {
      const promises = categories.map(async (category) => {
        const actual = actualHours[category.id] || 0;
        const planned = selectedPlans.find(p => p.categoryId === category.id)?.plannedHours || 0;
        const existingEntry = selectedEntries.find(e => e.categoryId === category.id);
        
        if (existingEntry) {
          return updateTimeEntry(existingEntry.id, { 
            actualHours: actual,
            plannedHours: planned,
          });
        } else {
          return createTimeEntry({
            date: selectedDate,
            categoryId: category.id,
            plannedHours: planned,
            actualHours: actual,
          });
        }
      });
      
      await Promise.all(promises);
    },
    onSuccess: () => {
      toast({ title: `Hours for ${selectedDateFormatted} saved successfully!` });
      console.log('Entry - Saving data for date:', selectedDate);
      console.log('Entry - Actual hours being saved:', actualHours);
      
      // Invalidate all related queries to ensure data consistency
      queryClient.invalidateQueries({ queryKey: ["time-entries"] });
      queryClient.invalidateQueries({ queryKey: ["current-week-data"] });
      queryClient.invalidateQueries({ queryKey: ["current-month-data"] });
      queryClient.invalidateQueries({ queryKey: ["daily-plans"] });
      // Also invalidate specific date queries
      queryClient.invalidateQueries({ queryKey: ["time-entries", selectedDate] });
      queryClient.invalidateQueries({ queryKey: ["daily-plans", selectedDate] });
      setLocation("/");
    },
    onError: (error) => {
      toast({ 
        title: "Failed to save entry", 
        description: error.message,
        variant: "destructive"
      });
    },
  });

  const handleHourChange = (categoryId: string, change: number) => {
    const planned = getPlannedHours(categoryId);
    const current = actualHours[categoryId] || 0;
    const newValue = current + change;
    
    // Cap at planned hours, but allow up to 24 hours maximum
    const maxAllowed = Math.min(planned, 24);
    
    setActualHours(prev => ({
      ...prev,
      [categoryId]: Math.max(0, Math.min(maxAllowed, newValue))
    }));
  };

  const handleInputChange = (categoryId: string, value: number) => {
    const planned = getPlannedHours(categoryId);
    const maxAllowed = Math.min(planned, 24);
    
    setActualHours(prev => ({
      ...prev,
      [categoryId]: Math.max(0, Math.min(maxAllowed, value))
    }));
  };

  const handleMarkAsComplete = (categoryId: string) => {
    const planned = getPlannedHours(categoryId);
    setActualHours(prev => ({
      ...prev,
      [categoryId]: planned
    }));
  };

  const getPlannedHours = (categoryId: string) => {
    const planned = selectedPlans.find(p => p.categoryId === categoryId)?.plannedHours || 0;
    return planned;
  };

  const isComplete = (categoryId: string) => {
    const planned = getPlannedHours(categoryId);
    const actual = actualHours[categoryId] || 0;
    return actual >= planned && planned > 0;
  };

  const getRemainingHours = (categoryId: string) => {
    const planned = getPlannedHours(categoryId);
    const actual = actualHours[categoryId] || 0;
    return Math.max(0, planned - actual);
  };

  // Calculate which week the selected date belongs to
  const getWeekOffset = () => {
    const today = new Date();
    const currentWeekStart = getWeekStart(today);
    const selectedWeekStart = getWeekStart(new Date(selectedDate));
    
    const currentWeekStartDate = new Date(currentWeekStart);
    const selectedWeekStartDate = new Date(selectedWeekStart);
    
    const diffTime = selectedWeekStartDate.getTime() - currentWeekStartDate.getTime();
    const diffWeeks = Math.round(diffTime / (1000 * 60 * 60 * 24 * 7));
    
    return diffWeeks;
  };

  const navigateToPlanningForWeek = () => {
    const weekOffset = getWeekOffset();
    // Store the week offset in sessionStorage so planning can use it
    sessionStorage.setItem('planningWeekOffset', weekOffset.toString());
    setLocation("/planning");
  };

  return (
    <div className="p-4 space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white mb-1">Log Hours</h1>
          <p className="text-xs text-gray-400">Record your daily activities</p>
        </div>
        <div className="flex items-center space-x-2">
          <select 
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white"
          >
            {availableDates.map((date) => (
              <option key={date.value} value={date.value}>
                {date.isToday ? `Today (${date.label})` : date.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Hour Entry Cards */}
      <div className="space-y-4">
        {selectedPlans.length === 0 && (
          <div className="bg-dark-secondary rounded-2xl p-6 text-center">
            <div className="text-text-muted mb-2">
              <i className="fas fa-info-circle text-lg"></i>
            </div>
            <p className="text-sm text-text-muted mb-3">
              No daily plans found for {selectedDateFormatted}. 
              You can still log hours, or set up daily goals in Planning.
            </p>
            <div className="text-xs text-text-muted mb-3">
              Date: {selectedDate} | Plans found: {selectedPlans.length}
            </div>
            <div className="flex space-x-2">
              <button 
                className="flex-1 bg-study-blue/20 text-study-blue py-2 px-4 rounded-lg text-sm font-medium hover:bg-study-blue/30 transition-colors"
                onClick={() => setLocation("/planning")}
              >
                <i className="fas fa-calendar-plus mr-2"></i>
                Go to Planning
              </button>
              <button 
                className="flex-1 bg-workout-green/20 text-workout-green py-2 px-4 rounded-lg text-sm font-medium hover:bg-workout-green/30 transition-colors"
                onClick={navigateToPlanningForWeek}
              >
                <i className="fas fa-calendar-week mr-2"></i>
                Plan This Week
              </button>
            </div>
          </div>
        )}
        
        {categories.map((category) => {
          const planned = getPlannedHours(category.id);
          const actual = actualHours[category.id] || 0;
          const remaining = getRemainingHours(category.id);
          const complete = isComplete(category.id);
          
          return (
            <div key={category.id} className="bg-dark-secondary rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: category.color }}
                  >
                    <i className={`${category.icon} text-white text-lg`}></i>
                  </div>
                  <div>
                    <h3 className="font-semibold">{category.name}</h3>
                    <p className="text-sm text-text-muted">Planned: {planned}h</p>
                  </div>
                </div>
                {planned > 0 && (
                  <div className="text-right">
                    <div className={`text-sm font-medium ${complete ? 'text-workout-green' : 'text-text-muted'}`}>
                      {complete ? 'Complete' : `${remaining}h remaining`}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex items-center justify-between mb-4">
                <span className="text-text-muted">Hours spent:</span>
                <div className="flex items-center space-x-3">
                  <button 
                    className="w-10 h-10 bg-dark-tertiary rounded-full flex items-center justify-center hover:bg-opacity-80 transition-colors disabled:opacity-50"
                    onClick={() => handleHourChange(category.id, -1)}
                    disabled={actual <= 0}
                  >
                    <i className="fas fa-minus text-text-muted"></i>
                  </button>
                  <input 
                    type="number" 
                    value={actual}
                    onChange={(e) => handleInputChange(category.id, parseFloat(e.target.value) || 0)}
                    min="0" 
                    max={Math.min(planned, 24)}
                    step="0.5"
                    className="w-16 h-12 bg-dark-tertiary rounded-lg text-center font-semibold text-lg border-none outline-none"
                  />
                  <button 
                    className="w-10 h-10 bg-dark-tertiary rounded-full flex items-center justify-center hover:bg-opacity-80 transition-colors disabled:opacity-50"
                    onClick={() => handleHourChange(category.id, 1)}
                    disabled={actual >= Math.min(planned, 24)}
                  >
                    <i className="fas fa-plus text-text-muted"></i>
                  </button>
                </div>
              </div>

              {/* Mark as Complete Button */}
              {planned > 0 && !complete && (
                <div className="mb-4">
                  <button 
                    className="w-full bg-workout-green/20 text-workout-green py-2 rounded-lg font-medium hover:bg-workout-green/30 transition-colors"
                    onClick={() => handleMarkAsComplete(category.id)}
                  >
                    <i className="fas fa-check mr-2"></i>
                    Mark as Complete ({planned}h)
                  </button>
                </div>
              )}
              
              {/* Progress indicator */}
              {planned > 0 && (
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-text-muted mb-1">
                    <span>Progress</span>
                    <span>{Math.round((actual / planned) * 100)}%</span>
                  </div>
                  <div className="w-full bg-dark-tertiary rounded-full h-2">
                    <div 
                      className="h-2 rounded-full transition-all duration-300"
                      style={{ 
                        backgroundColor: category.color,
                        width: `${Math.min(100, (actual / planned) * 100)}%`
                      }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Save Button at Bottom */}
      <div className="py-4 flex justify-center">
        <button 
          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white py-4 px-6 rounded-xl font-semibold flex items-center justify-center space-x-2 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/25"
          onClick={() => saveEntryMutation.mutate()}
          disabled={saveEntryMutation.isPending}
        >
          {saveEntryMutation.isPending ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Saving...</span>
            </>
          ) : (
            <>
              <i className="fas fa-save text-lg"></i>
              <span>Save Hours for {selectedDateFormatted}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
