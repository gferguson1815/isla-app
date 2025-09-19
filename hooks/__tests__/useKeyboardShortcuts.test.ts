import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useKeyboardShortcuts } from "../useKeyboardShortcuts";

describe("useKeyboardShortcuts", () => {
  let addEventListenerSpy: ReturnType<typeof vi.spyOn>;
  let removeEventListenerSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    addEventListenerSpy = vi.spyOn(document, "addEventListener");
    removeEventListenerSpy = vi.spyOn(document, "removeEventListener");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should add event listener on mount", () => {
    renderHook(() =>
      useKeyboardShortcuts([
        {
          key: "k",
          metaKey: true,
          handler: vi.fn(),
        },
      ])
    );

    expect(addEventListenerSpy).toHaveBeenCalledWith("keydown", expect.any(Function));
  });

  it("should remove event listener on unmount", () => {
    const { unmount } = renderHook(() =>
      useKeyboardShortcuts([
        {
          key: "k",
          metaKey: true,
          handler: vi.fn(),
        },
      ])
    );

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith("keydown", expect.any(Function));
  });

  it("should call handler when matching shortcut is pressed", () => {
    const handler = vi.fn();
    renderHook(() =>
      useKeyboardShortcuts([
        {
          key: "k",
          metaKey: true,
          handler,
        },
      ])
    );

    const event = new KeyboardEvent("keydown", {
      key: "k",
      metaKey: true,
    });

    act(() => {
      document.dispatchEvent(event);
    });

    expect(handler).toHaveBeenCalledWith(event);
  });

  it("should not call handler when shortcut does not match", () => {
    const handler = vi.fn();
    renderHook(() =>
      useKeyboardShortcuts([
        {
          key: "k",
          metaKey: true,
          handler,
        },
      ])
    );

    const event = new KeyboardEvent("keydown", {
      key: "k",
      metaKey: false, // Different modifier
    });

    act(() => {
      document.dispatchEvent(event);
    });

    expect(handler).not.toHaveBeenCalled();
  });

  it("should handle multiple shortcuts", () => {
    const handler1 = vi.fn();
    const handler2 = vi.fn();

    renderHook(() =>
      useKeyboardShortcuts([
        {
          key: "k",
          metaKey: true,
          handler: handler1,
        },
        {
          key: "/",
          handler: handler2,
        },
      ])
    );

    const event1 = new KeyboardEvent("keydown", {
      key: "k",
      metaKey: true,
    });

    const event2 = new KeyboardEvent("keydown", {
      key: "/",
    });

    act(() => {
      document.dispatchEvent(event1);
      document.dispatchEvent(event2);
    });

    expect(handler1).toHaveBeenCalledOnce();
    expect(handler2).toHaveBeenCalledOnce();
  });

  it("should prevent default when preventDefault is true", () => {
    const handler = vi.fn();
    const preventDefaultSpy = vi.fn();

    renderHook(() =>
      useKeyboardShortcuts([
        {
          key: "k",
          metaKey: true,
          handler,
          preventDefault: true,
        },
      ])
    );

    const event = new KeyboardEvent("keydown", {
      key: "k",
      metaKey: true,
    });
    Object.defineProperty(event, "preventDefault", {
      value: preventDefaultSpy,
    });

    act(() => {
      document.dispatchEvent(event);
    });

    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  it("should not prevent default when preventDefault is false", () => {
    const handler = vi.fn();
    const preventDefaultSpy = vi.fn();

    renderHook(() =>
      useKeyboardShortcuts([
        {
          key: "k",
          metaKey: true,
          handler,
          preventDefault: false,
        },
      ])
    );

    const event = new KeyboardEvent("keydown", {
      key: "k",
      metaKey: true,
    });
    Object.defineProperty(event, "preventDefault", {
      value: preventDefaultSpy,
    });

    act(() => {
      document.dispatchEvent(event);
    });

    expect(preventDefaultSpy).not.toHaveBeenCalled();
  });

  it("should not trigger when typing in input fields", () => {
    const handler = vi.fn();
    renderHook(() =>
      useKeyboardShortcuts([
        {
          key: "/",
          handler,
        },
      ])
    );

    const input = document.createElement("input");
    document.body.appendChild(input);
    input.focus();

    const event = new KeyboardEvent("keydown", {
      key: "/",
    });

    act(() => {
      document.dispatchEvent(event);
    });

    expect(handler).not.toHaveBeenCalled();

    document.body.removeChild(input);
  });

  it("should trigger meta/ctrl shortcuts even when typing", () => {
    const handler = vi.fn();
    renderHook(() =>
      useKeyboardShortcuts([
        {
          key: "k",
          metaKey: true,
          handler,
        },
      ])
    );

    const input = document.createElement("input");
    document.body.appendChild(input);
    input.focus();

    const event = new KeyboardEvent("keydown", {
      key: "k",
      metaKey: true,
    });

    act(() => {
      document.dispatchEvent(event);
    });

    expect(handler).toHaveBeenCalledOnce();

    document.body.removeChild(input);
  });

  it("should respect enabled option", () => {
    const handler = vi.fn();
    const { rerender } = renderHook(
      ({ enabled }) =>
        useKeyboardShortcuts(
          [
            {
              key: "k",
              metaKey: true,
              handler,
            },
          ],
          { enabled }
        ),
      {
        initialProps: { enabled: false },
      }
    );

    const event = new KeyboardEvent("keydown", {
      key: "k",
      metaKey: true,
    });

    act(() => {
      document.dispatchEvent(event);
    });

    expect(handler).not.toHaveBeenCalled();

    rerender({ enabled: true });

    act(() => {
      document.dispatchEvent(event);
    });

    expect(handler).toHaveBeenCalledOnce();
  });
});
