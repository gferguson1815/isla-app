"use client";

import { useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { escapeHtml, sanitizeTags } from "@/lib/utils/sanitize";

export interface CsvRow {
  destinationUrl: string;
  customSlug?: string;
  title?: string;
  tags?: string[];
  folder?: string;
  validation: {
    status: "valid" | "warning" | "error";
    messages: string[];
  };
}

interface CsvPreviewTableProps {
  rows: CsvRow[];
  maxRows?: number;
}

export function CsvPreviewTable({ rows, maxRows = 10 }: CsvPreviewTableProps) {
  const displayRows = useMemo(() => {
    return rows.slice(0, maxRows);
  }, [rows, maxRows]);

  const stats = useMemo(() => {
    const valid = rows.filter(r => r.validation.status === "valid").length;
    const warnings = rows.filter(r => r.validation.status === "warning").length;
    const errors = rows.filter(r => r.validation.status === "error").length;
    return { valid, warnings, errors, total: rows.length };
  }, [rows]);

  const getStatusIcon = (status: CsvRow["validation"]["status"]) => {
    switch (status) {
      case "valid":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getRowClassName = (status: CsvRow["validation"]["status"]) => {
    switch (status) {
      case "valid":
        return "bg-green-50/50";
      case "warning":
        return "bg-yellow-50/50";
      case "error":
        return "bg-red-50/50";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-4 text-sm">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <span>{stats.valid} valid</span>
        </div>
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-yellow-500" />
          <span>{stats.warnings} warnings</span>
        </div>
        <div className="flex items-center gap-2">
          <XCircle className="h-4 w-4 text-red-500" />
          <span>{stats.errors} errors</span>
        </div>
        <div className="ml-auto text-muted-foreground">
          Total: {stats.total} rows
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">Status</TableHead>
              <TableHead>Destination URL</TableHead>
              <TableHead>Custom Slug</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead>Folder</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayRows.map((row, index) => (
              <TableRow
                key={index}
                className={cn(getRowClassName(row.validation.status))}
              >
                <TableCell>
                  <div className="flex items-center">
                    {getStatusIcon(row.validation.status)}
                  </div>
                </TableCell>
                <TableCell className="font-mono text-xs">
                  <div className="max-w-xs truncate" title={row.destinationUrl}>
                    {escapeHtml(row.destinationUrl)}
                  </div>
                  {row.validation.messages.length > 0 && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {escapeHtml(row.validation.messages[0])}
                    </div>
                  )}
                </TableCell>
                <TableCell className="font-mono text-xs">
                  {row.customSlug ? escapeHtml(row.customSlug) : "-"}
                </TableCell>
                <TableCell className="text-xs">
                  <div className="max-w-xs truncate" title={row.title || ""}>
                    {row.title ? escapeHtml(row.title) : "-"}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1 flex-wrap">
                    {row.tags && row.tags.length > 0 ? (
                      sanitizeTags(row.tags).slice(0, 3).map((tag, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                    {row.tags && row.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{row.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-xs">{row.folder || "-"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {rows.length > maxRows && (
        <p className="text-sm text-muted-foreground text-center">
          Showing first {maxRows} of {rows.length} rows
        </p>
      )}
    </div>
  );
}