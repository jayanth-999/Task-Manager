import { openDB } from 'idb';
import type { DBSchema, IDBPDatabase } from 'idb';
import { supabase, isCloudConfigured } from './supabaseClient';
import type { Task, Roadmap, Habit, HabitLog, FocusSession, Recipe, Note } from '../types';

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
  habit_logs: {
    key: string;
    value: HabitLog;
    indexes: { 'by-user': string; 'by-habit': string };
  };
  focus_sessions: {
    key: string;
    value: FocusSession;
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
    dbPromise = openDB<ApexDBSchema>('apex-productivity-db', 2, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
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
        }

        if (oldVersion < 2) {
          if (!db.objectStoreNames.contains('habit_logs')) {
            const habitLogStore = db.createObjectStore('habit_logs', { keyPath: 'id' });
            habitLogStore.createIndex('by-user', 'user_id');
            habitLogStore.createIndex('by-habit', 'habit_id');
          }
          if (!db.objectStoreNames.contains('focus_sessions')) {
            const focusStore = db.createObjectStore('focus_sessions', { keyPath: 'id' });
            focusStore.createIndex('by-user', 'user_id');
          }
        }
      },
    });
  }
  return dbPromise;
}

export type SyncStatus = 'saved-locally' | 'syncing' | 'synced' | 'offline' | 'error';

type SyncStatusListener = (status: SyncStatus) => void;
const syncStatusListeners = new Set<SyncStatusListener>();
let currentSyncStatus: SyncStatus = 'synced';

function updateSyncStatus(status: SyncStatus) {
  currentSyncStatus = status;
  syncStatusListeners.forEach(listener => {
    try {
      listener(status);
    } catch (e) {
      console.error('Error in sync status listener:', e);
    }
  });
}

export class SyncEngine {
  static getSyncStatus(): SyncStatus {
    return currentSyncStatus;
  }

  static onSyncStatusChange(listener: SyncStatusListener): () => void {
    syncStatusListeners.add(listener);
    listener(currentSyncStatus);
    return () => syncStatusListeners.delete(listener);
  }

  /**
   * Save an item directly to IndexedDB without adding it to the outgoing sync queue.
   * Crucial for hydrating cloud reads into local storage.
   */
  static async saveLocalItemWithoutQueue(
    table: 'tasks' | 'roadmaps' | 'habits' | 'habit_logs' | 'focus_sessions' | 'recipes' | 'notes',
    item: any
  ): Promise<void> {
    const db = await getDB();
    await (db as any).put(table, item);
  }

  /**
   * Bulk-save items directly to IndexedDB without queueing them for cloud sync.
   */
  static async bulkSaveLocalItemsWithoutQueue(
    table: 'tasks' | 'roadmaps' | 'habits' | 'habit_logs' | 'focus_sessions' | 'recipes' | 'notes',
    items: any[]
  ): Promise<void> {
    if (items.length === 0) return;
    const db = await getDB();
    const tx = db.transaction(table as any, 'readwrite');
    for (const item of items) {
      await tx.store.put(item);
    }
    await tx.done;
  }

  static async saveLocalItem(
    table: 'tasks' | 'roadmaps' | 'habits' | 'habit_logs' | 'focus_sessions' | 'recipes' | 'notes',
    item: any,
    operation: 'INSERT' | 'UPDATE' = 'UPDATE'
  ): Promise<void> {
    const db = await getDB();
    await (db as any).put(table, item);
    if (isCloudConfigured) {
      updateSyncStatus('saved-locally');
      await (db as any).add('sync_queue', {
        table,
        operation,
        data: item,
        timestamp: Date.now(),
        retry_count: 0,
      });
      // Trigger background processing if online
      if (typeof navigator !== 'undefined' && navigator.onLine) {
        SyncEngine.processSyncQueue();
      }
    }
  }

  static async getLocalItems<T>(
    table: 'tasks' | 'roadmaps' | 'habits' | 'habit_logs' | 'focus_sessions' | 'recipes' | 'notes',
    userId: string
  ): Promise<T[]> {
    const db = await getDB();
    const tx = db.transaction(table as any, 'readonly');
    const index = (tx.store as any).index('by-user');
    const items = await index.getAll(userId);
    return (items.filter((i: any) => !i.deleted_at) as unknown) as T[];
  }

  /** Includes soft-deleted records; use only for recovery flows such as Undo. */
  static async getLocalItem<T>(
    table: 'tasks' | 'roadmaps' | 'habits' | 'habit_logs' | 'focus_sessions' | 'recipes' | 'notes',
    id: string
  ): Promise<T | undefined> {
    const db = await getDB();
    return (db as any).get(table, id) as Promise<T | undefined>;
  }

  static async deleteLocalItem(
    table: 'tasks' | 'roadmaps' | 'habits' | 'focus_sessions' | 'recipes' | 'notes',
    id: string
  ): Promise<void> {
    const db = await getDB();
    await (db as any).delete(table, id);
    if (isCloudConfigured) {
      await (db as any).add('sync_queue', {
        table,
        operation: 'DELETE',
        data: { id },
        timestamp: Date.now(),
      });
    }
  }

  static async getSyncQueue(): Promise<any[]> {
    const db = await getDB();
    return db.getAll('sync_queue');
  }

  static async processSyncQueue(): Promise<void> {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      updateSyncStatus('offline');
      return;
    }
    if (!isCloudConfigured) return;
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user) return;

    const db = await getDB();
    const queue = await db.getAll('sync_queue');
    if (queue.length === 0) {
      updateSyncStatus('synced');
      return;
    }

    updateSyncStatus('syncing');
    let hasError = false;

    for (const item of queue) {
      try {
        if (item.operation === 'UPDATE' || item.operation === 'INSERT') {
          const { error } = await supabase.from(item.table as any).upsert(item.data as any);
          if (error) {
            hasError = true;
            console.warn(`Sync upsert error for table ${item.table}:`, error);
          } else if (item.id) {
            await db.delete('sync_queue', item.id);
          }
        } else if (item.operation === 'DELETE') {
          const { error } = await supabase.from(item.table as any).delete().eq('id', item.data.id);
          if (error) {
            hasError = true;
            console.warn(`Sync delete error for table ${item.table}:`, error);
          } else if (item.id) {
            await db.delete('sync_queue', item.id);
          }
        }
      } catch (err) {
        hasError = true;
        console.warn(`Sync error for table ${item.table}:`, err);
      }
    }

    updateSyncStatus(hasError ? 'error' : 'synced');
  }

  static async migrateGuestDataToAccount(targetUserId: string): Promise<void> {
    const db = await getDB();
    const guestUserId = 'guest-local-user';

    const tables: Array<'tasks' | 'roadmaps' | 'habits' | 'habit_logs' | 'focus_sessions'> = [
      'tasks',
      'roadmaps',
      'habits',
      'habit_logs',
      'focus_sessions',
    ];

    for (const table of tables) {
      const items = await (db as any).getAllFromIndex(table, 'by-user', guestUserId);
      for (const item of items) {
        const rekeyedItem = {
          ...item,
          user_id: targetUserId,
          updated_at: new Date().toISOString(),
        };
        await db.put(table as any, rekeyedItem as any);
        if (isCloudConfigured) {
          const { error } = await supabase.from(table as any).upsert(rekeyedItem as any);
          if (error) throw error;
        }
      }
    }
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    SyncEngine.processSyncQueue();
  });
}
