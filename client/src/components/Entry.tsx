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
  return date.toISOString().split('T')[0];
}

export default function Entry() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const today = useMemo(() => formatDate(new Date()), []);
  const todayFormatted = useMemo(() => {
    return new Date().toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  }, []);

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });

  const { data: todayEntries = [] } = useQuery({
    queryKey: ["time-entries", today],
    queryFn: () => getTimeEntries(today),
  });

  const { data: todayPlans = [] } = useQuery({
    queryKey: ["daily-plans", today],
    queryFn: () => getDailyPlans(today),
  });

  // Local state for actual hours
  const [actualHours, setActualHours] = useState<Record<string, number>>({});

  // Initialize actual hours when data loads
  useEffect(() => {
    if (categories.length > 0) {
      const initialValues: Record<string, number> = {};
      categories.forEach(category => {
        const existingEntry = todayEntries.find(e => e.categoryId === category.id);
        initialValues[category.id] = existingEntry?.actualHours || 0;
      });
      setActualHours(initialValues);
    }
  }, [categories, todayEntries]);

  const saveEntryMutation = useMutation({
    mutationFn: async () => {
      const promises = categories.map(async (category) => {
        const actual = actualHours[category.id] || 0;
        const planned = todayPlans.find(p => p.categoryId === category.id)?.plannedHours || 0;
        const existingEntry = todayEntries.find(e => e.categoryId === category.id);
        
        if (existingEntry) {
          return updateTimeEntry(existingEntry.id, { 
            actualHours: actual,
            plannedHours: planned,
          });
        } else {
          return createTimeEntry({
            date: today,
            categoryId: category.id,
            plannedHours: planned,
            actualHours: actual,
          });
        }
      });
      
      await Promise.all(promises);
    },
    onSuccess: () => {
      toast({ title: "Today's hours saved successfully!" });
      queryClient.invalidateQueries({ queryKey: ["time-entries"] });
      queryClient.invalidateQueries({ queryKey: ["current-week-data"] });
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
    setActualHours(prev => ({
      ...prev,
      [categoryId]: Math.max(0, Math.min(24, (prev[categoryId] || 0) + change))
    }));
  };

  const handleInputChange = (categoryId: string, value: number) => {
    setActualHours(prev => ({
      ...prev,
      [categoryId]: Math.max(0, Math.min(24, value))
    }));
  };

  const getPlannedHours = (categoryId: string) => {
    return todayPlans.find(p => p.categoryId === categoryId)?.plannedHours || 0;
  };

  return (
    <div className="p-4 space-y-6 pb-20">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Log Hours</h2>
        <span className="text-sm text-text-muted">{todayFormatted}</span>
      </div>

      {/* Hour Entry Cards */}
      <div className="space-y-4">
        {categories.map((category) => {
          const planned = getPlannedHours(category.id);
          const actual = actualHours[category.id] || 0;
          
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
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-text-muted">Hours spent:</span>
                <div className="flex items-center space-x-3">
                  <button 
                    className="w-10 h-10 bg-dark-tertiary rounded-full flex items-center justify-center hover:bg-opacity-80 transition-colors"
                    onClick={() => handleHourChange(category.id, -1)}
                  >
                    <i className="fas fa-minus text-text-muted"></i>
                  </button>
                  <input 
                    type="number" 
                    value={actual}
                    onChange={(e) => handleInputChange(category.id, parseFloat(e.target.value) || 0)}
                    min="0" 
                    max="24" 
                    step="0.5"
                    className="w-16 h-12 bg-dark-tertiary rounded-lg text-center font-semibold text-lg border-none outline-none"
                  />
                  <button 
                    className="w-10 h-10 bg-dark-tertiary rounded-full flex items-center justify-center hover:bg-opacity-80 transition-colors"
                    onClick={() => handleHourChange(category.id, 1)}
                  >
                    <i className="fas fa-plus text-text-muted"></i>
                  </button>
                </div>
              </div>
              
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

      <button 
        className="w-full bg-gradient-to-r from-study-blue to-workout-green text-white font-semibold py-4 rounded-xl disabled:opacity-50 transition-opacity"
        onClick={() => saveEntryMutation.mutate()}
        disabled={saveEntryMutation.isPending}
      >
        {saveEntryMutation.isPending ? "Saving..." : "Save Today's Hours"}
      </button>
    </div>
  );
}
