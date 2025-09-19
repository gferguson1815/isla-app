"use client";

import { useState, useEffect } from "react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pause, Play, X, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ImportProgressBarProps {
  total: number;
  current: number;
  status: "idle" | "importing" | "paused" | "completed" | "cancelled" | "error";
  currentItem?: string;
  onPause: () => void;
  onResume: () => void;
  onCancel: () => void;
}

export function ImportProgressBar({
  total,
  current,
  status,
  currentItem,
  onPause,
  onResume,
  onCancel,
}: ImportProgressBarProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const percentage = total > 0 ? (current / total) * 100 : 0;
    setProgress(percentage);
  }, [current, total]);

  const getStatusText = () => {
    switch (status) {
      case "importing":
        return `Importing link ${current} of ${total}...`;
      case "paused":
        return `Paused at link ${current} of ${total}`;
      case "completed":
        return `Successfully imported ${total} links!`;
      case "cancelled":
        return `Import cancelled at link ${current} of ${total}`;
      case "error":
        return `Error occurred at link ${current} of ${total}`;
      default:
        return "Ready to import";
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case "completed":
        return "bg-green-500";
      case "error":
        return "bg-red-500";
      case "cancelled":
        return "bg-yellow-500";
      default:
        return "bg-primary";
    }
  };

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="space-y-1 flex-1">
          <p className="text-sm font-medium">{getStatusText()}</p>
          {currentItem && status === "importing" && (
            <p className="text-xs text-muted-foreground truncate max-w-md">
              {currentItem}
            </p>
          )}
        </div>

        <div className="flex gap-2">
          {status === "importing" && (
            <Button
              variant="outline"
              size="sm"
              onClick={onPause}
              className="h-8"
            >
              <Pause className="h-3 w-3 mr-1" />
              Pause
            </Button>
          )}

          {status === "paused" && (
            <Button
              variant="outline"
              size="sm"
              onClick={onResume}
              className="h-8"
            >
              <Play className="h-3 w-3 mr-1" />
              Resume
            </Button>
          )}

          {(status === "importing" || status === "paused") && (
            <Button
              variant="destructive"
              size="sm"
              onClick={onCancel}
              className="h-8"
            >
              <X className="h-3 w-3 mr-1" />
              Cancel
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <div className="relative">
          <Progress value={progress} className="h-2" />
          <AnimatePresence>
            {status === "importing" && (
              <motion.div
                className={`absolute top-0 left-0 h-2 ${getStatusColor()} rounded-full opacity-30`}
                style={{ width: `${progress}%` }}
                animate={{
                  opacity: [0.3, 0.6, 0.3],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            )}
          </AnimatePresence>
        </div>

        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{current} / {total}</span>
          <span>{Math.round(progress)}%</span>
        </div>
      </div>

      <AnimatePresence>
        {status === "completed" && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-2 text-sm text-green-600"
          >
            <CheckCircle className="h-4 w-4" />
            Import completed successfully!
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}