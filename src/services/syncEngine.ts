import { openDB } from 'idb';
import type { DBSchema, IDBPDatabase } from 'idb';
import { supabase } from './supabaseClient';
import type { Task, Roadmap, Habit, Recipe, Note } from '../types';

interface ApexDBSchema extends DBSchema {
  tasks: {
    key: string;
    value: Task;
    indexes: { 'by-user': string; 'by-status': string; 'by-date': string };
  };
  roadmaps: {
    key: string;
    value: Roadmap;
    indexes: { 'by-user': string };
  };
  habits: {
    key: string;
    value: Habit;
    indexes: { 'by-user': string };
  };
  recipes: {
    key: string;
    value: Recipe;
    indexes: { 'by-user': string };
  };
  notes: {
    key: string;
    value: Note;
    indexes: { 'by-user': string };
  };
  sync_queue: {
    key: number;
    value: {
      id?: number;
      table: string;
      operation: 'INSERT' | 'UPDATE' | 'DELETE';
      data: any;
      timestamp: number;
    };
  };
}

let dbPromise: Promise<IDBPDatabase<ApexDBSchema>> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<ApexDBSchema>('apex-productivity-db', 1, {
      upgrade(db) {
        const taskStore = db.createObjectStore('tasks', { keyPath: 'id' });
        taskStore.createIndex('by-user', 'user_id');
        taskStore.createIndex('by-status', 'status');
        taskStore.createIndex('by-date', 'due_date');

        const roadmapStore = db.createObjectStore('roadmaps', { keyPath: 'id' });
        roadmapStore.createIndex('by-user', 'user_id');

        const habitStore = db.createObjectStore('habits', { keyPath: 'id' });
        habitStore.createIndex('by-user', 'user_id');

        const recipeStore = db.createObjectStore('recipes', { keyPath: 'id' });
        recipeStore.createIndex('by-user', 'user_id');

        const noteStore = db.createObjectStore('notes', { keyPath: 'id' });
        noteStore.createIndex('by-user', 'user_id');

        db.createObjectStore('sync_queue', { keyPath: 'id', autoIncrement: true });
      },
    });
  }
  return dbPromise;
}

export class SyncEngine {
  static async saveLocalItem(table: 'tasks' | 'roadmaps' | 'habits' | 'recipes' | 'notes', item: any): Promise<void> {
    const db = await getDB();
    await (db as any).put(table, item);
    await (db as any).add('sync_queue', {
      table,
      operation: 'UPDATE',
      data: item,
      timestamp: Date.now(),
    });
  }

  static async getLocalItems<T>(table: 'tasks' | 'roadmaps' | 'habits' | 'recipes' | 'notes', userId: string): Promise<T[]> {
    const db = await getDB();
    const tx = db.transaction(table as any, 'readonly');
    const index = (tx.store as any).index('by-user');
    const items = await index.getAll(userId);
    return (items.filter((i: any) => !i.deleted_at) as unknown) as T[];
  }

  static async processSyncQueue(): Promise<void> {
    if (!navigator.onLine) return;
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user) return;

    const db = await getDB();
    const queue = await db.getAll('sync_queue');
    if (queue.length === 0) return;

    for (const item of queue) {
      try {
        if (item.operation === 'UPDATE' || item.operation === 'INSERT') {
          const { error } = await supabase.from(item.table as any).upsert(item.data as any);
          if (!error && item.id) {
            await db.delete('sync_queue', item.id);
          }
        } else if (item.operation === 'DELETE') {
          const { error } = await supabase.from(item.table as any).delete().eq('id', item.data.id);
          if (!error && item.id) {
            await db.delete('sync_queue', item.id);
          }
        }
      } catch (err) {
        console.warn(`Sync error for table ${item.table}:`, err);
      }
    }
  }

  static async migrateGuestDataToAccount(targetUserId: string): Promise<void> {
    const db = await getDB();
    const guestUserId = 'guest-local-user';

    const tables: Array<'tasks' | 'roadmaps' | 'habits' | 'recipes' | 'notes'> = [
      'tasks',
      'roadmaps',
      'habits',
      'recipes',
      'notes',
    ];

    for (const table of tables) {
      const items = await db.getAllFromIndex(table, 'by-user', guestUserId);
      for (const item of items) {
        const rekeyedItem = {
          ...item,
          user_id: targetUserId,
          updated_at: new Date().toISOString(),
        };
        await db.put(table, rekeyedItem as any);
        await supabase.from(table as any).upsert(rekeyedItem as any);
      }
    }
  }
}

window.addEventListener('online', () => {
  SyncEngine.processSyncQueue();
});
