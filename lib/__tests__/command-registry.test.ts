import { describe, it, expect, beforeEach, vi } from "vitest";
import { commandRegistry, Command } from "../command-registry";

describe("CommandRegistry", () => {
  beforeEach(() => {
    commandRegistry.clear();
    commandRegistry.clearRecent();
  });

  describe("register", () => {
    it("should register a command", () => {
      const command: Command = {
        id: "test-command",
        name: "Test Command",
        category: "actions",
        handler: vi.fn(),
      };

      commandRegistry.register(command);
      const retrieved = commandRegistry.get("test-command");

      expect(retrieved).toEqual(command);
    });

    it("should register multiple commands", () => {
      const commands: Command[] = [
        {
          id: "command-1",
          name: "Command 1",
          category: "navigation",
          handler: vi.fn(),
        },
        {
          id: "command-2",
          name: "Command 2",
          category: "actions",
          handler: vi.fn(),
        },
      ];

      commandRegistry.registerBatch(commands);
      const allCommands = commandRegistry.getAll();

      expect(allCommands).toHaveLength(2);
      expect(allCommands).toEqual(expect.arrayContaining(commands));
    });
  });

  describe("unregister", () => {
    it("should unregister a command", () => {
      const command: Command = {
        id: "test-command",
        name: "Test Command",
        category: "actions",
        handler: vi.fn(),
      };

      commandRegistry.register(command);
      commandRegistry.unregister("test-command");
      const retrieved = commandRegistry.get("test-command");

      expect(retrieved).toBeUndefined();
    });
  });

  describe("getByCategory", () => {
    it("should return commands by category", () => {
      const navigationCommand: Command = {
        id: "nav-command",
        name: "Navigation Command",
        category: "navigation",
        handler: vi.fn(),
      };

      const actionCommand: Command = {
        id: "action-command",
        name: "Action Command",
        category: "actions",
        handler: vi.fn(),
      };

      commandRegistry.registerBatch([navigationCommand, actionCommand]);
      const navigationCommands = commandRegistry.getByCategory("navigation");

      expect(navigationCommands).toHaveLength(1);
      expect(navigationCommands[0]).toEqual(navigationCommand);
    });
  });

  describe("search", () => {
    it("should search commands by name", () => {
      const commands: Command[] = [
        {
          id: "create-link",
          name: "Create Link",
          category: "actions",
          handler: vi.fn(),
        },
        {
          id: "delete-link",
          name: "Delete Link",
          category: "actions",
          handler: vi.fn(),
        },
        {
          id: "home",
          name: "Go Home",
          category: "navigation",
          handler: vi.fn(),
        },
      ];

      commandRegistry.registerBatch(commands);
      const results = commandRegistry.search("link");

      expect(results).toHaveLength(2);
      expect(results.map((c) => c.id)).toEqual(["create-link", "delete-link"]);
    });

    it("should search commands by description", () => {
      const command: Command = {
        id: "test",
        name: "Test",
        description: "This is a test command",
        category: "actions",
        handler: vi.fn(),
      };

      commandRegistry.register(command);
      const results = commandRegistry.search("test command");

      expect(results).toHaveLength(1);
      expect(results[0]).toEqual(command);
    });

    it("should search commands by keywords", () => {
      const command: Command = {
        id: "test",
        name: "Test",
        category: "actions",
        handler: vi.fn(),
        keywords: ["foo", "bar", "baz"],
      };

      commandRegistry.register(command);
      const results = commandRegistry.search("bar");

      expect(results).toHaveLength(1);
      expect(results[0]).toEqual(command);
    });
  });

  describe("execute", () => {
    it("should execute a command handler", async () => {
      const handler = vi.fn();
      const command: Command = {
        id: "test-command",
        name: "Test Command",
        category: "actions",
        handler,
      };

      commandRegistry.register(command);
      await commandRegistry.execute("test-command");

      expect(handler).toHaveBeenCalledOnce();
    });

    it("should throw error for non-existent command", async () => {
      await expect(commandRegistry.execute("non-existent")).rejects.toThrow(
        "Command non-existent not found"
      );
    });

    it("should add executed command to recent commands", async () => {
      const command: Command = {
        id: "test-command",
        name: "Test Command",
        category: "actions",
        handler: vi.fn(),
      };

      commandRegistry.register(command);
      await commandRegistry.execute("test-command");
      const recentCommands = commandRegistry.getRecentCommands();

      expect(recentCommands).toHaveLength(1);
      expect(recentCommands[0]).toEqual(command);
    });

    it("should limit recent commands to MAX_RECENT", async () => {
      const commands: Command[] = Array.from({ length: 10 }, (_, i) => ({
        id: `command-${i}`,
        name: `Command ${i}`,
        category: "actions",
        handler: vi.fn(),
      }));

      commandRegistry.registerBatch(commands);

      for (const command of commands) {
        await commandRegistry.execute(command.id);
      }

      const recentCommands = commandRegistry.getRecentCommands();
      expect(recentCommands.length).toBeLessThanOrEqual(5); // MAX_RECENT is 5
    });
  });

  describe("clear", () => {
    it("should clear all commands", () => {
      const commands: Command[] = [
        {
          id: "command-1",
          name: "Command 1",
          category: "navigation",
          handler: vi.fn(),
        },
        {
          id: "command-2",
          name: "Command 2",
          category: "actions",
          handler: vi.fn(),
        },
      ];

      commandRegistry.registerBatch(commands);
      commandRegistry.clear();
      const allCommands = commandRegistry.getAll();

      expect(allCommands).toHaveLength(0);
    });
  });
});
