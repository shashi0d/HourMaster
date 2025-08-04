// Storage interface for time tracker
// Since this is a client-side app using IndexedDB, 
// the server storage is minimal
export interface IStorage {
  // Add methods here if needed for server-side operations
}

export class MemStorage implements IStorage {
  constructor() {
    // Minimal storage implementation
  }
}