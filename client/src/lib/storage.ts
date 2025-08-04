import { getDB } from './db';
import type { 
  Category, 
  TimeEntry, 
  WeeklyGoal, 
  DailyPlan,
  InsertCategory,
  InsertTimeEntry,
  InsertWeeklyGoal,
  InsertDailyPlan 
} from '@shared/schema';
import { DEFAULT_CATEGORIES } from '@shared/schema';

// Utility functions
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function getISODate(): string {
  return new Date().toISOString();
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  d.setDate(diff);
  return formatDate(d);
}

// Categories
export async function getCategories(): Promise<Category[]> {
  const db = await getDB();
  const categories = await db.getAll('categories');
  
  if (categories.length === 0) {
    // Initialize with default categories
    for (const cat of DEFAULT_CATEGORIES) {
      await createCategory(cat);
    }
    return await db.getAll('categories');
  }
  
  return categories.sort((a, b) => a.order - b.order);
}

export async function createCategory(category: InsertCategory): Promise<Category> {
  const db = await getDB();
  const now = getISODate();
  const newCategory: Category = {
    id: generateId(),
    ...category,
  };
  
  await db.add('categories', newCategory);
  return newCategory;
}

export async function updateCategory(id: string, updates: Partial<InsertCategory>): Promise<Category> {
  const db = await getDB();
  const existing = await db.get('categories', id);
  if (!existing) {
    throw new Error('Category not found');
  }
  
  const updated: Category = { ...existing, ...updates };
  await db.put('categories', updated);
  return updated;
}

export async function deleteCategory(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('categories', id);
}

// Time Entries
export async function getTimeEntries(date?: string): Promise<TimeEntry[]> {
  const db = await getDB();
  
  if (date) {
    return db.getAllFromIndex('timeEntries', 'by-date', date);
  }
  
  return db.getAll('timeEntries');
}

export async function getTimeEntriesByDateRange(startDate: string, endDate: string): Promise<TimeEntry[]> {
  const db = await getDB();
  const allEntries = await db.getAll('timeEntries');
  
  return allEntries.filter(entry => 
    entry.date >= startDate && entry.date <= endDate
  );
}

export async function createTimeEntry(entry: InsertTimeEntry): Promise<TimeEntry> {
  const db = await getDB();
  const now = getISODate();
  const newEntry: TimeEntry = {
    id: generateId(),
    createdAt: now,
    updatedAt: now,
    ...entry,
  };
  
  await db.add('timeEntries', newEntry);
  return newEntry;
}

export async function updateTimeEntry(id: string, updates: Partial<InsertTimeEntry>): Promise<TimeEntry> {
  const db = await getDB();
  const existing = await db.get('timeEntries', id);
  if (!existing) {
    throw new Error('Time entry not found');
  }
  
  const updated: TimeEntry = { 
    ...existing, 
    ...updates, 
    updatedAt: getISODate() 
  };
  await db.put('timeEntries', updated);
  return updated;
}

export async function deleteTimeEntry(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('timeEntries', id);
}

// Weekly Goals
export async function getWeeklyGoals(weekStart?: string): Promise<WeeklyGoal[]> {
  const db = await getDB();
  
  if (weekStart) {
    return db.getAllFromIndex('weeklyGoals', 'by-week-start', weekStart);
  }
  
  return db.getAll('weeklyGoals');
}

export async function createWeeklyGoal(goal: InsertWeeklyGoal): Promise<WeeklyGoal> {
  const db = await getDB();
  const now = getISODate();
  const newGoal: WeeklyGoal = {
    id: generateId(),
    createdAt: now,
    updatedAt: now,
    ...goal,
  };
  
  await db.add('weeklyGoals', newGoal);
  return newGoal;
}

export async function updateWeeklyGoal(id: string, updates: Partial<InsertWeeklyGoal>): Promise<WeeklyGoal> {
  const db = await getDB();
  const existing = await db.get('weeklyGoals', id);
  if (!existing) {
    throw new Error('Weekly goal not found');
  }
  
  const updated: WeeklyGoal = { 
    ...existing, 
    ...updates, 
    updatedAt: getISODate() 
  };
  await db.put('weeklyGoals', updated);
  return updated;
}

export async function deleteWeeklyGoal(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('weeklyGoals', id);
}

// Daily Plans
export async function getDailyPlans(date?: string): Promise<DailyPlan[]> {
  const db = await getDB();
  
  if (date) {
    return db.getAllFromIndex('dailyPlans', 'by-date', date);
  }
  
  return db.getAll('dailyPlans');
}

export async function getDailyPlansByDateRange(startDate: string, endDate: string): Promise<DailyPlan[]> {
  const db = await getDB();
  const allPlans = await db.getAll('dailyPlans');
  
  return allPlans.filter(plan => 
    plan.date >= startDate && plan.date <= endDate
  );
}

export async function createDailyPlan(plan: InsertDailyPlan): Promise<DailyPlan> {
  const db = await getDB();
  const now = getISODate();
  const newPlan: DailyPlan = {
    id: generateId(),
    createdAt: now,
    updatedAt: now,
    ...plan,
  };
  
  await db.add('dailyPlans', newPlan);
  return newPlan;
}

export async function updateDailyPlan(id: string, updates: Partial<InsertDailyPlan>): Promise<DailyPlan> {
  const db = await getDB();
  const existing = await db.get('dailyPlans', id);
  if (!existing) {
    throw new Error('Daily plan not found');
  }
  
  const updated: DailyPlan = { 
    ...existing, 
    ...updates, 
    updatedAt: getISODate() 
  };
  await db.put('dailyPlans', updated);
  return updated;
}

export async function deleteDailyPlan(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('dailyPlans', id);
}

// Helper functions for analytics
export async function getCurrentWeekData() {
  const today = new Date();
  const weekStart = getWeekStart(today);
  const weekEnd = new Date(today);
  weekEnd.setDate(weekEnd.getDate() + (6 - today.getDay() + 1));
  
  const entries = await getTimeEntriesByDateRange(weekStart, formatDate(weekEnd));
  const goals = await getWeeklyGoals(weekStart);
  const plans = await getDailyPlansByDateRange(weekStart, formatDate(weekEnd));
  
  return { entries, goals, plans, weekStart, weekEnd: formatDate(weekEnd) };
}

export async function getCurrentMonthData() {
  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  
  const entries = await getTimeEntriesByDateRange(
    formatDate(monthStart), 
    formatDate(monthEnd)
  );
  
  return { entries, monthStart: formatDate(monthStart), monthEnd: formatDate(monthEnd) };
}

// Data export
export async function exportAllData() {
  const categories = await getCategories();
  const timeEntries = await getTimeEntries();
  const weeklyGoals = await getWeeklyGoals();
  const dailyPlans = await getDailyPlans();
  
  return {
    categories,
    timeEntries,
    weeklyGoals,
    dailyPlans,
    exportDate: getISODate(),
  };
}
