import { z } from "zod";

// Core category schema
export const categorySchema = z.object({
  id: z.string(),
  name: z.string(),
  icon: z.string(),
  color: z.string(),
  order: z.number(),
  defaultHours: z.number().min(0).max(24).default(0),
});

// Time entry schema
export const timeEntrySchema = z.object({
  id: z.string(),
  date: z.string(), // YYYY-MM-DD format
  categoryId: z.string(),
  plannedHours: z.number().min(0).max(24),
  actualHours: z.number().min(0).max(24),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// Weekly goal schema
export const weeklyGoalSchema = z.object({
  id: z.string(),
  weekStart: z.string(), // YYYY-MM-DD format (Monday)
  categoryId: z.string(),
  targetHours: z.number().min(0),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// Daily plan schema
export const dailyPlanSchema = z.object({
  id: z.string(),
  date: z.string(), // YYYY-MM-DD format
  categoryId: z.string(),
  plannedHours: z.number().min(0).max(24),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// Insert schemas
export const insertCategorySchema = categorySchema.omit({ id: true });
export const insertTimeEntrySchema = timeEntrySchema.omit({ id: true, createdAt: true, updatedAt: true });
export const insertWeeklyGoalSchema = weeklyGoalSchema.omit({ id: true, createdAt: true, updatedAt: true });
export const insertDailyPlanSchema = dailyPlanSchema.omit({ id: true, createdAt: true, updatedAt: true });

// Types
export type Category = z.infer<typeof categorySchema>;
export type TimeEntry = z.infer<typeof timeEntrySchema>;
export type WeeklyGoal = z.infer<typeof weeklyGoalSchema>;
export type DailyPlan = z.infer<typeof dailyPlanSchema>;

export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type InsertTimeEntry = z.infer<typeof insertTimeEntrySchema>;
export type InsertWeeklyGoal = z.infer<typeof insertWeeklyGoalSchema>;
export type InsertDailyPlan = z.infer<typeof insertDailyPlanSchema>;

// Default categories
export const DEFAULT_CATEGORIES: InsertCategory[] = [
  {
    name: "Study",
    icon: "fas fa-book",
    color: "hsl(217, 91%, 60%)", // study-blue
    order: 1,
    defaultHours: 4,
  },
  {
    name: "Sleep",
    icon: "fas fa-bed",
    color: "hsl(262, 83%, 69%)", // sleep-purple
    order: 2,
    defaultHours: 8,
  },
  {
    name: "Workout",
    icon: "fas fa-dumbbell",
    color: "hsl(158, 64%, 52%)", // workout-green
    order: 3,
    defaultHours: 1,
  },
];
