"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FileDown, MoreHorizontal, Eye, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export interface ImportRecord {
  id: string;
  fileName: string;
  totalRows: number;
  successCount: number;
  errorCount: number;
  status: "processing" | "completed" | "partial" | "failed";
  createdAt: Date;
  createdBy: {
    email: string;
    name?: string;
  };
}

interface ImportHistoryProps {
  imports: ImportRecord[];
  onView: (id: string) => void;
  onDelete: (id: string) => void;
  onDownloadErrors: (id: string) => void;
}

export function ImportHistory({
  imports,
  onView,
  onDelete,
  onDownloadErrors,
}: ImportHistoryProps) {
  const getStatusBadge = (status: ImportRecord["status"]) => {
    const variants: Record<ImportRecord["status"], {
      variant: "default" | "secondary" | "destructive" | "outline";
      label: string;
    }> = {
      processing: { variant: "secondary", label: "Processing" },
      completed: { variant: "default", label: "Completed" },
      partial: { variant: "outline", label: "Partial Success" },
      failed: { variant: "destructive", label: "Failed" },
    };

    const { variant, label } = variants[status];
    return <Badge variant={variant}>{label}</Badge>;
  };

  if (imports.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No import history yet. Start by importing a CSV file.
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>File Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Rows</TableHead>
            <TableHead>Success</TableHead>
            <TableHead>Errors</TableHead>
            <TableHead>Imported By</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {imports.map((record) => (
            <TableRow key={record.id}>
              <TableCell className="font-medium">{record.fileName}</TableCell>
              <TableCell>{getStatusBadge(record.status)}</TableCell>
              <TableCell>{record.totalRows}</TableCell>
              <TableCell className="text-green-600">
                {record.successCount}
              </TableCell>
              <TableCell className="text-red-600">
                {record.errorCount}
              </TableCell>
              <TableCell>
                <div className="text-sm">
                  <div>{record.createdBy.name || record.createdBy.email}</div>
                  {record.createdBy.name && (
                    <div className="text-xs text-muted-foreground">
                      {record.createdBy.email}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatDistanceToNow(record.createdAt, { addSuffix: true })}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onView(record.id)}>
                      <Eye className="h-3 w-3 mr-2" />
                      View Imported Links
                    </DropdownMenuItem>
                    {record.errorCount > 0 && (
                      <DropdownMenuItem
                        onClick={() => onDownloadErrors(record.id)}
                      >
                        <FileDown className="h-3 w-3 mr-2" />
                        Download Error Report
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      onClick={() => onDelete(record.id)}
                      className="text-red-600"
                    >
                      <Trash2 className="h-3 w-3 mr-2" />
                      Delete Import
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}