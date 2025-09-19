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

class CommandRegistry {
  private commands: Map<string, Command> = new Map();
  private recentCommandIds: string[] = [];
  private readonly MAX_RECENT = 5;
  private readonly STORAGE_KEY = "recentCommands";

  constructor() {
    if (typeof window !== "undefined") {
      this.loadRecentCommands();
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

    await command.handler();
    this.addToRecent(id);
  }

  private addToRecent(id: string) {
    this.recentCommandIds = [
      id,
      ...this.recentCommandIds.filter((recentId) => recentId !== id),
    ].slice(0, this.MAX_RECENT);
    this.saveRecentCommands();
  }

  private loadRecentCommands() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        this.recentCommandIds = JSON.parse(stored);
      }
    } catch (error) {
      console.error("Failed to load recent commands:", error);
    }
  }

  private saveRecentCommands() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.recentCommandIds));
    } catch (error) {
      console.error("Failed to save recent commands:", error);
    }
  }

  clear() {
    this.commands.clear();
    return this;
  }

  clearRecent() {
    this.recentCommandIds = [];
    this.saveRecentCommands();
    return this;
  }
}

export const commandRegistry = new CommandRegistry();
