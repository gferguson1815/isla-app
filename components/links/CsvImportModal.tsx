"use client";

import { useState, useCallback, useMemo } from "react";
import { useDropzone } from "react-dropzone";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, FileUp, AlertCircle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (file: File, columnMapping: ColumnMapping) => void;
  workspaceSlug: string;
}

interface ColumnMapping {
  destinationUrl: string;
  customSlug?: string;
  title?: string;
  tags?: string;
  folder?: string;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const REQUIRED_COLUMNS = ["destination_url"];
const OPTIONAL_COLUMNS = ["custom_slug", "title", "tags", "folder"];
const ALL_COLUMNS = [...REQUIRED_COLUMNS, ...OPTIONAL_COLUMNS];

export function CsvImportModal({
  isOpen,
  onClose,
  onImport,
  workspaceSlug,
}: CsvImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({
    destinationUrl: "",
    customSlug: "",
    title: "",
    tags: "",
    folder: "",
  });
  const [isDetecting, setIsDetecting] = useState(false);

  const detectCsvFormat = useCallback(async (file: File) => {
    setIsDetecting(true);
    setError(null);
    
    try {
      const text = await file.text();
      const lines = text.split("\n");
      
      if (lines.length === 0) {
        throw new Error("CSV file is empty");
      }
      
      const headerLine = lines[0];
      const headers = headerLine
        .split(",")
        .map(h => h.trim().toLowerCase().replace(/['"]/g, ""));
      
      setCsvHeaders(headers);
      
      const autoMapping: ColumnMapping = {
        destinationUrl: headers.find(h => 
          h.includes("destination") || h.includes("url") || h === "link"
        ) || "",
        customSlug: headers.find(h => 
          h.includes("slug") || h.includes("short") || h === "alias"
        ) || "",
        title: headers.find(h => 
          h === "title" || h === "name" || h === "label"
        ) || "",
        tags: headers.find(h => 
          h === "tags" || h === "tag" || h === "labels"
        ) || "",
        folder: headers.find(h => 
          h === "folder" || h === "category" || h === "group"
        ) || "",
      };
      
      setColumnMapping(autoMapping);
      
      if (!autoMapping.destinationUrl) {
        setError("Could not auto-detect destination URL column. Please map it manually.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse CSV file");
    } finally {
      setIsDetecting(false);
    }
  }, []);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    
    if (!file) return;
    
    if (file.size > MAX_FILE_SIZE) {
      setError("File size exceeds 5MB limit");
      return;
    }
    
    if (!file.name.endsWith(".csv")) {
      setError("Please upload a CSV file");
      return;
    }
    
    setFile(file);
    await detectCsvFormat(file);
  }, [detectCsvFormat]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/csv": [".csv"],
    },
    maxFiles: 1,
    maxSize: MAX_FILE_SIZE,
  });

  const handleColumnMappingChange = (field: keyof ColumnMapping, value: string) => {
    setColumnMapping(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const canProceed = useMemo(() => {
    return file && columnMapping.destinationUrl && !error && !isDetecting;
  }, [file, columnMapping.destinationUrl, error, isDetecting]);

  const handleImport = () => {
    if (file && canProceed) {
      onImport(file, columnMapping);
    }
  };

  const handleClose = () => {
    setFile(null);
    setError(null);
    setCsvHeaders([]);
    setColumnMapping({
      destinationUrl: "",
      customSlug: "",
      title: "",
      tags: "",
      folder: "",
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import Links from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file to bulk import links to your workspace
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!file ? (
            <Card
              {...getRootProps()}
              className={cn(
                "border-2 border-dashed p-8 text-center cursor-pointer transition-colors",
                isDragActive
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25 hover:border-primary/50"
              )}
            >
              <input {...getInputProps()} />
              <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm font-medium mb-1">
                {isDragActive
                  ? "Drop your CSV file here"
                  : "Drag and drop your CSV file here"}
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                or click to browse
              </p>
              <p className="text-xs text-muted-foreground">
                Maximum file size: 5MB
              </p>
            </Card>
          ) : (
            <>
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-900">
                  <span className="font-medium">{file.name}</span> ({(file.size / 1024).toFixed(2)} KB)
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-2 h-auto p-1 text-green-700 hover:text-green-900"
                    onClick={() => {
                      setFile(null);
                      setCsvHeaders([]);
                      setError(null);
                    }}
                  >
                    Change file
                  </Button>
                </AlertDescription>
              </Alert>

              {csvHeaders.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Column Mapping</h4>
                  <p className="text-xs text-muted-foreground">
                    Map your CSV columns to link fields
                  </p>
                  
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2 items-center">
                      <label className="text-sm font-medium">
                        Destination URL <span className="text-red-500">*</span>
                      </label>
                      <Select
                        value={columnMapping.destinationUrl}
                        onValueChange={(value) =>
                          handleColumnMappingChange("destinationUrl", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select column" />
                        </SelectTrigger>
                        <SelectContent>
                          {csvHeaders.map((header) => (
                            <SelectItem key={header} value={header}>
                              {header}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-2 items-center">
                      <label className="text-sm">Custom Slug</label>
                      <Select
                        value={columnMapping.customSlug}
                        onValueChange={(value) =>
                          handleColumnMappingChange("customSlug", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select column (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">None</SelectItem>
                          {csvHeaders.map((header) => (
                            <SelectItem key={header} value={header}>
                              {header}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-2 items-center">
                      <label className="text-sm">Title</label>
                      <Select
                        value={columnMapping.title}
                        onValueChange={(value) =>
                          handleColumnMappingChange("title", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select column (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">None</SelectItem>
                          {csvHeaders.map((header) => (
                            <SelectItem key={header} value={header}>
                              {header}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-2 items-center">
                      <label className="text-sm">Tags</label>
                      <Select
                        value={columnMapping.tags}
                        onValueChange={(value) =>
                          handleColumnMappingChange("tags", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select column (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">None</SelectItem>
                          {csvHeaders.map((header) => (
                            <SelectItem key={header} value={header}>
                              {header}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-2 items-center">
                      <label className="text-sm">Folder</label>
                      <Select
                        value={columnMapping.folder}
                        onValueChange={(value) =>
                          handleColumnMappingChange("folder", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select column (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">None</SelectItem>
                          {csvHeaders.map((header) => (
                            <SelectItem key={header} value={header}>
                              {header}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={!canProceed}>
            {isDetecting ? "Detecting format..." : "Continue to Preview"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}