import { LucideIcon } from "lucide-react";

export type CommandCategory = "navigation" | "actions" | "search" | "recent";

export interface Command {
  id: string;
  name: string;
  description?: string;
  category: CommandCategory;
  icon?: LucideIcon;
  shortcut?: string;
  handler: () => void | Promise<void>;
  keywords?: string[];
}

interface StoredCommandHistory {
  recentCommandIds: string[];
  commandStats: Record<string, { count: number; lastUsed: number; avgExecutionTime?: number }>;
  version: string;
}

class CommandRegistry {
  private commands: Map<string, Command> = new Map();
  private recentCommandIds: string[] = [];
  private commandStats: Record<string, { count: number; lastUsed: number; avgExecutionTime?: number }> = {};
  private readonly MAX_RECENT = 5;
  private readonly STORAGE_KEY = "commandHistory";
  private readonly STORAGE_VERSION = "1.0";

  constructor() {
    if (typeof window !== "undefined") {
      this.loadCommandHistory();
    }
  }

  register(command: Command) {
    this.commands.set(command.id, command);
    return this;
  }

  registerBatch(commands: Command[]) {
    commands.forEach((command) => this.register(command));
    return this;
  }

  unregister(id: string) {
    this.commands.delete(id);
    return this;
  }

  get(id: string): Command | undefined {
    return this.commands.get(id);
  }

  getAll(): Command[] {
    return Array.from(this.commands.values());
  }

  getByCategory(category: CommandCategory): Command[] {
    return this.getAll().filter((command) => command.category === category);
  }

  search(query: string): Command[] {
    const normalizedQuery = query.toLowerCase();
    return this.getAll().filter((command) => {
      const nameMatch = command.name.toLowerCase().includes(normalizedQuery);
      const descriptionMatch = command.description?.toLowerCase().includes(normalizedQuery);
      const keywordsMatch = command.keywords?.some((keyword) =>
        keyword.toLowerCase().includes(normalizedQuery)
      );
      return nameMatch || descriptionMatch || keywordsMatch;
    });
  }

  getRecentCommands(): Command[] {
    return this.recentCommandIds
      .map((id) => this.get(id))
      .filter((command): command is Command => command !== undefined);
  }

  async execute(id: string) {
    const command = this.get(id);
    if (!command) {
      throw new Error(`Command ${id} not found`);
    }

    const startTime = performance.now();

    try {
      await command.handler();
      const executionTime = performance.now() - startTime;
      this.addToRecent(id, executionTime);
    } catch (error) {
      console.error(`Failed to execute command ${command.name}:`, error);

      // Re-throw with more context
      const enhancedError = new Error(
        `Failed to execute "${command.name}": ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      enhancedError.cause = error;
      throw enhancedError;
    }
  }

  private addToRecent(id: string, executionTime?: number) {
    // Update recent commands list
    this.recentCommandIds = [
      id,
      ...this.recentCommandIds.filter((recentId) => recentId !== id),
    ].slice(0, this.MAX_RECENT);

    // Update command statistics
    const now = Date.now();
    const stats = this.commandStats[id] || { count: 0, lastUsed: now };

    this.commandStats[id] = {
      count: stats.count + 1,
      lastUsed: now,
      avgExecutionTime: executionTime !== undefined
        ? stats.avgExecutionTime
          ? (stats.avgExecutionTime + executionTime) / 2
          : executionTime
        : stats.avgExecutionTime,
    };

    this.saveCommandHistory();
  }

  private loadCommandHistory() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const history: StoredCommandHistory = JSON.parse(stored);

        // Check version compatibility
        if (history.version === this.STORAGE_VERSION) {
          this.recentCommandIds = history.recentCommandIds || [];
          this.commandStats = history.commandStats || {};
        } else {
          // Migrate from old format if needed
          this.migrateFromLegacyStorage();
        }
      } else {
        // Try to load from legacy storage
        this.migrateFromLegacyStorage();
      }
    } catch (error) {
      console.error("Failed to load command history:", error);
      this.recentCommandIds = [];
      this.commandStats = {};
    }
  }

  private migrateFromLegacyStorage() {
    try {
      // Try to load from old storage key
      const oldStored = localStorage.getItem("recentCommands");
      if (oldStored) {
        const oldRecentCommands = JSON.parse(oldStored);
        if (Array.isArray(oldRecentCommands)) {
          this.recentCommandIds = oldRecentCommands;
          // Create basic stats for migrated commands
          const now = Date.now();
          oldRecentCommands.forEach((id: string, index: number) => {
            this.commandStats[id] = {
              count: oldRecentCommands.length - index, // More recent = higher count
              lastUsed: now - (index * 60000), // Spread out over time
            };
          });
          // Save in new format and remove old
          this.saveCommandHistory();
          localStorage.removeItem("recentCommands");
        }
      }
    } catch (error) {
      console.error("Failed to migrate from legacy storage:", error);
    }
  }

  private saveCommandHistory() {
    try {
      const history: StoredCommandHistory = {
        recentCommandIds: this.recentCommandIds,
        commandStats: this.commandStats,
        version: this.STORAGE_VERSION,
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(history));
    } catch (error) {
      console.error("Failed to save command history:", error);
    }
  }

  clear() {
    this.commands.clear();
    return this;
  }

  clearRecent() {
    this.recentCommandIds = [];
    this.saveCommandHistory();
    return this;
  }

  // New methods for enhanced functionality
  getCommandStats(id: string) {
    return this.commandStats[id] || null;
  }

  getPopularCommands(limit: number = 5): Command[] {
    const sortedStats = Object.entries(this.commandStats)
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, limit)
      .map(([id]) => this.get(id))
      .filter((command): command is Command => command !== undefined);

    return sortedStats;
  }

  getRecentlyUsedCommands(limit: number = 10): Command[] {
    const sortedStats = Object.entries(this.commandStats)
      .sort(([, a], [, b]) => b.lastUsed - a.lastUsed)
      .slice(0, limit)
      .map(([id]) => this.get(id))
      .filter((command): command is Command => command !== undefined);

    return sortedStats;
  }

  exportHistory(): StoredCommandHistory {
    return {
      recentCommandIds: this.recentCommandIds,
      commandStats: this.commandStats,
      version: this.STORAGE_VERSION,
    };
  }

  importHistory(history: StoredCommandHistory) {
    if (history.version === this.STORAGE_VERSION) {
      this.recentCommandIds = history.recentCommandIds || [];
      this.commandStats = history.commandStats || {};
      this.saveCommandHistory();
    } else {
      console.warn("Cannot import history: version mismatch");
    }
  }
}

export const commandRegistry = new CommandRegistry();
