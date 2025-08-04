import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Category, TimeEntry, WeeklyGoal, DailyPlan } from '@shared/schema';

interface TimeTrackerDB extends DBSchema {
  categories: {
    key: string;
    value: Category;
  };
  timeEntries: {
    key: string;
    value: TimeEntry;
    indexes: {
      'by-date': string;
      'by-category': string;
      'by-date-category': [string, string];
    };
  };
  weeklyGoals: {
    key: string;
    value: WeeklyGoal;
    indexes: {
      'by-week-start': string;
      'by-category': string;
      'by-week-category': [string, string];
    };
  };
  dailyPlans: {
    key: string;
    value: DailyPlan;
    indexes: {
      'by-date': string;
      'by-category': string;
      'by-date-category': [string, string];
    };
  };
}

let dbInstance: IDBPDatabase<TimeTrackerDB> | null = null;

export async function initDB(): Promise<IDBPDatabase<TimeTrackerDB>> {
  if (dbInstance) {
    return dbInstance;
  }

  dbInstance = await openDB<TimeTrackerDB>('TimeTrackerDB', 1, {
    upgrade(db) {
      // Categories store
      const categoriesStore = db.createObjectStore('categories', {
        keyPath: 'id',
      });

      // Time entries store
      const timeEntriesStore = db.createObjectStore('timeEntries', {
        keyPath: 'id',
      });
      timeEntriesStore.createIndex('by-date', 'date');
      timeEntriesStore.createIndex('by-category', 'categoryId');
      timeEntriesStore.createIndex('by-date-category', ['date', 'categoryId']);

      // Weekly goals store
      const weeklyGoalsStore = db.createObjectStore('weeklyGoals', {
        keyPath: 'id',
      });
      weeklyGoalsStore.createIndex('by-week-start', 'weekStart');
      weeklyGoalsStore.createIndex('by-category', 'categoryId');
      weeklyGoalsStore.createIndex('by-week-category', ['weekStart', 'categoryId']);

      // Daily plans store
      const dailyPlansStore = db.createObjectStore('dailyPlans', {
        keyPath: 'id',
      });
      dailyPlansStore.createIndex('by-date', 'date');
      dailyPlansStore.createIndex('by-category', 'categoryId');
      dailyPlansStore.createIndex('by-date-category', ['date', 'categoryId']);
    },
  });

  return dbInstance;
}

export async function getDB(): Promise<IDBPDatabase<TimeTrackerDB>> {
  if (!dbInstance) {
    return initDB();
  }
  return dbInstance;
}
