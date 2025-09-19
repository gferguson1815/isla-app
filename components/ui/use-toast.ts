import { useState, useEffect } from "react";

interface Toast {
  id: string;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  variant?: "default" | "destructive" | "warning";
}

interface ToastState {
  toasts: Toast[];
}

const listeners: Array<(state: ToastState) => void> = [];
let memoryState: ToastState = { toasts: [] };

function dispatch(action: { type: "ADD_TOAST"; toast: Toast } | { type: "REMOVE_TOAST"; toastId?: string }) {
  if (action.type === "ADD_TOAST") {
    memoryState = {
      toasts: [...memoryState.toasts, action.toast],
    };
  } else if (action.type === "REMOVE_TOAST") {
    memoryState = {
      toasts: memoryState.toasts.filter((toast) => toast.id !== action.toastId),
    };
  }
  
  listeners.forEach((listener) => {
    listener(memoryState);
  });
}

export function toast(props: Omit<Toast, "id">) {
  const id = Math.random().toString(36);
  const toast: Toast = {
    ...props,
    id,
  };
  
  dispatch({ type: "ADD_TOAST", toast });
  
  setTimeout(() => {
    dispatch({ type: "REMOVE_TOAST", toastId: id });
  }, 5000);
  
  return {
    id,
    dismiss: () => dispatch({ type: "REMOVE_TOAST", toastId: id }),
  };
}

export function useToast() {
  const [state, setState] = useState<ToastState>(memoryState);

  useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, [state]);

  return {
    toasts: state.toasts,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: "REMOVE_TOAST", toastId }),
  };
}