"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CsvImportModal } from "@/components/links/CsvImportModal";
import { CsvPreviewTable } from "@/components/links/CsvPreviewTable";
import { ImportProgressBar } from "@/components/links/ImportProgressBar";
import { ImportHistory } from "@/components/links/ImportHistory";
import { useCsvImport } from "@/hooks/useCsvImport";
import { api } from "@/utils/api";
import { ArrowLeft, Upload, FileSpreadsheet } from "lucide-react";
import { Confetti } from "@/components/ui/confetti";
import type { ColumnMapping } from "@/lib/csv-parser";

export default function CsvImportPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceSlug = params.slug as string;

  const [showImportModal, setShowImportModal] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [activeTab, setActiveTab] = useState<"import" | "history">("import");

  // Get workspace ID from slug
  const { data: workspace } = api.workspace.getBySlug.useQuery(
    { slug: workspaceSlug },
    { enabled: !!workspaceSlug }
  );

  const {
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
    isImporting,
  } = useCsvImport({
    workspaceId: workspace?.id || "",
    onSuccess: (result) => {
      if (result.failed === 0) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000);
      }
    },
  });

  // Get import history
  const { data: importHistory } = api.link.getImportHistory.useQuery(
    { workspaceId: workspace?.id || "" },
    { enabled: !!workspace?.id }
  );

  const handleFileSelect = async (selectedFile: File, columnMapping: ColumnMapping) => {
    setFile(selectedFile);
    setShowImportModal(false);
    await validateFile(selectedFile, columnMapping);
  };

  const handleViewImport = (importId: string) => {
    router.push(`/workspace/${workspaceSlug}/links?importId=${importId}`);
  };

  const handleDeleteImport = async (importId: string) => {
    // Would need to implement delete mutation
    console.log("Delete import:", importId);
  };

  const handleDownloadErrors = (importId: string) => {
    // Would need to implement error download for specific import
    console.log("Download errors for:", importId);
  };

  const getPlanLimits = () => {
    const limits = {
      free: 10,
      starter: 100,
      growth: 1000,
    };
    return limits[workspace?.plan as keyof typeof limits] || 10;
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {showConfetti && <Confetti />}
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/workspace/${workspaceSlug}/links`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Links
          </Button>
          <div>
            <h1 className="text-2xl font-bold">CSV Import</h1>
            <p className="text-muted-foreground">
              Bulk import links from CSV files
            </p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "import" | "history")}>
        <TabsList>
          <TabsTrigger value="import">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </TabsTrigger>
          <TabsTrigger value="history">
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="import" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Import Settings</CardTitle>
              <CardDescription>
                Your {workspace?.plan} plan allows importing up to {getPlanLimits()} links at once.
                You have {workspace?.max_links || 0} - {workspace?.linkCount || 0} = {(workspace?.max_links || 0) - (workspace?.linkCount || 0)} links remaining.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!file && (
                <Button onClick={() => setShowImportModal(true)}>
                  <Upload className="h-4 w-4 mr-2" />
                  Select CSV File
                </Button>
              )}

              {file && (
                <div className="space-y-4">
                  <Card className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{file.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {rows.length} rows • {(file.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => reset()}
                        >
                          Change File
                        </Button>
                        {rows.some(r => r.validation.status !== "valid") && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={downloadErrorReport}
                          >
                            Download Errors
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>

                  {importProgress.status !== "idle" && (
                    <ImportProgressBar
                      total={importProgress.total}
                      current={importProgress.current}
                      status={importProgress.status}
                      currentItem={importProgress.currentItem}
                      onPause={pauseImport}
                      onResume={resumeImport}
                      onCancel={cancelImport}
                    />
                  )}

                  {rows.length > 0 && (
                    <>
                      <CsvPreviewTable rows={rows} />
                      
                      {importProgress.status === "idle" && (
                        <div className="flex justify-end">
                          <Button
                            onClick={startImport}
                            disabled={isImporting || rows.every(r => r.validation.status === "error")}
                          >
                            Start Import
                          </Button>
                        </div>
                      )}

                      {importProgress.status === "completed" && (
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            onClick={() => router.push(`/workspace/${workspaceSlug}/links`)}
                          >
                            View Imported Links
                          </Button>
                          <Button onClick={() => reset()}>
                            Import Another File
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Import History</CardTitle>
              <CardDescription>
                View and manage your previous CSV imports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ImportHistory
                imports={importHistory || []}
                onView={handleViewImport}
                onDelete={handleDeleteImport}
                onDownloadErrors={handleDownloadErrors}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <CsvImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleFileSelect}
        workspaceSlug={workspaceSlug}
      />
    </div>
  );
}