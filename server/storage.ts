// This file is kept for compatibility but the main storage is handled by the Python backend
export interface IStorage {
  // Interface kept for compatibility
}

export class MemStorage implements IStorage {
  constructor() {
    // Implementation delegated to Python backend
  }
}

export const storage = new MemStorage();
