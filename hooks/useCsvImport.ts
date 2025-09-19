import { useState, useCallback } from "react";
import { api } from "@/utils/api";
import { parseCsvFile, generateErrorReport, type ColumnMapping } from "@/lib/csv-parser";
import type { CsvRow } from "@/components/links/CsvPreviewTable";
import { toast } from "@/components/ui/use-toast";

interface UseCsvImportOptions {
  workspaceId: string;
  onSuccess?: (result: ImportResult) => void;
  onError?: (error: Error) => void;
}

interface ImportResult {
  successful: number;
  failed: number;
  errors: Array<{ index: number; error: string }>;
}

export function useCsvImport({
  workspaceId,
  onSuccess,
  onError,
}: UseCsvImportOptions) {
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<CsvRow[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [importProgress, setImportProgress] = useState({
    current: 0,
    total: 0,
    status: "idle" as "idle" | "importing" | "paused" | "completed" | "cancelled" | "error",
    currentItem: "",
  });
  const [isPaused, setIsPaused] = useState(false);

  const bulkImportMutation = api.link.bulkImportCsv.useMutation({
    onSuccess: (result) => {
      setImportProgress(prev => ({
        ...prev,
        status: "completed",
        current: prev.total,
      }));

      if (result.failed === 0) {
        toast({
          title: "Import Successful",
          description: `Successfully imported ${result.successful} links`,
        });
      } else {
        toast({
          title: "Import Partially Successful",
          description: `Imported ${result.successful} links, ${result.failed} failed`,
          variant: "warning",
        });
      }

      onSuccess?.(result);
    },
    onError: (error) => {
      setImportProgress(prev => ({
        ...prev,
        status: "error",
      }));

      toast({
        title: "Import Failed",
        description: error.message,
        variant: "destructive",
      });

      onError?.(error as Error);
    },
  });

  const validateFile = useCallback(async (
    file: File,
    columnMapping: ColumnMapping
  ): Promise<CsvRow[]> => {
    setIsValidating(true);
    
    try {
      // First validate file on server
      const firstBytes = new Uint8Array(await file.slice(0, 512).arrayBuffer());
      const base64FirstBytes = btoa(String.fromCharCode(...firstBytes));
      
      const validationResult = await api.links.validateCsvFile.mutate({
        fileName: file.name,
        fileType: file.type || 'text/csv',
        fileSize: file.size,
        firstBytes: base64FirstBytes,
      });
      
      if (!validationResult.valid) {
        throw new Error('Invalid CSV file');
      }
      // Get existing slugs for duplicate checking
      const existingSlugsQuery = await fetch(`/api/workspaces/${workspaceId}/slugs`);
      const existingSlugs = new Set<string>();
      
      if (existingSlugsQuery.ok) {
        const data = await existingSlugsQuery.json();
        data.forEach((s: { slug: string }) => existingSlugs.add(s.slug));
      }

      const parseResult = await parseCsvFile(file, columnMapping, existingSlugs);
      
      if (parseResult.errors.length > 0) {
        toast({
          title: "CSV Parsing Errors",
          description: parseResult.errors[0],
          variant: "warning",
        });
      }

      setRows(parseResult.rows);
      return parseResult.rows;
    } finally {
      setIsValidating(false);
    }
  }, [workspaceId]);

  const startImport = useCallback(async () => {
    if (!file || rows.length === 0) return;

    const validRows = rows.filter(r => r.validation.status !== "error");
    
    if (validRows.length === 0) {
      toast({
        title: "No Valid Rows",
        description: "All rows contain errors. Please fix them before importing.",
        variant: "destructive",
      });
      return;
    }

    setImportProgress({
      current: 0,
      total: validRows.length,
      status: "importing",
      currentItem: "",
    });

    const importId = crypto.randomUUID();
    
    // Convert all rows to links format
    const links = validRows.map(row => ({
      url: row.destinationUrl,
      slug: row.customSlug,
      title: row.title,
      tags: row.tags,
      folderId: undefined, // Would need folder lookup
    }));

    // Send all links in a single API call
    // The server will handle chunking internally for better performance
    const result = await bulkImportMutation.mutateAsync({
      workspaceId,
      links,
      importId,
    });
    
    // Simulate progress updates for UX (since we can't get real-time from server yet)
    const simulateProgress = () => {
      let current = 0;
      const interval = setInterval(() => {
        if (isPaused) {
          clearInterval(interval);
          setImportProgress(prev => ({ ...prev, status: "paused" }));
          return;
        }
        
        current = Math.min(current + Math.floor(validRows.length / 10), validRows.length);
        setImportProgress({
          current,
          total: validRows.length,
          status: current < validRows.length ? "importing" : "completed",
          currentItem: links[Math.min(current, links.length - 1)]?.url || "",
        });
        
        if (current >= validRows.length) {
          clearInterval(interval);
        }
      }, 200);
    };
    
    simulateProgress();
  }, [file, rows, workspaceId, isPaused, bulkImportMutation]);

  const pauseImport = useCallback(() => {
    setIsPaused(true);
    setImportProgress(prev => ({ ...prev, status: "paused" }));
  }, []);

  const resumeImport = useCallback(() => {
    setIsPaused(false);
    setImportProgress(prev => ({ ...prev, status: "importing" }));
    startImport();
  }, [startImport]);

  const cancelImport = useCallback(() => {
    setIsPaused(false);
    setImportProgress({
      current: 0,
      total: 0,
      status: "cancelled",
      currentItem: "",
    });
  }, []);

  const downloadErrorReport = useCallback(() => {
    const errorRows = rows.filter(
      r => r.validation.status === "error" || r.validation.status === "warning"
    );
    
    if (errorRows.length === 0) {
      toast({
        title: "No Errors",
        description: "There are no errors to download",
      });
      return;
    }

    const csvContent = generateErrorReport(errorRows);
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `import-errors-${new Date().toISOString()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }, [rows]);

  const reset = useCallback(() => {
    setFile(null);
    setRows([]);
    setIsValidating(false);
    setImportProgress({
      current: 0,
      total: 0,
      status: "idle",
      currentItem: "",
    });
    setIsPaused(false);
  }, []);

  return {
    file,
    setFile,
    rows,
    validateFile,
    isValidating,
    importProgress,
    startImport,
    pauseImport,
    resumeImport,
    cancelImport,
    downloadErrorReport,
    reset,
    isImporting: bulkImportMutation.isPending,
  };
}