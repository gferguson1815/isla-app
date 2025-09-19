'use client';

import { memo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { trpc } from '@/app/providers/trpc-provider';
import { format } from 'date-fns';

interface ExportButtonProps {
  linkId: string;
  dateRange: '24h' | '7d' | '30d' | 'custom';
}

export const ExportButton = memo(function ExportButton({
  linkId,
  dateRange
}: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const exportMutation = trpc.analytics.exportAnalytics.useMutation({
    onSuccess: (data) => {
      const blob = new Blob([data.csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-${linkId}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Analytics exported successfully');
    },
    onError: (error) => {
      toast.error('Failed to export analytics: ' + error.message);
    },
    onSettled: () => {
      setIsExporting(false);
    }
  });

  const handleExport = async () => {
    setIsExporting(true);

    const now = new Date();
    let startDate: Date;
    let endDate = now;

    switch (dateRange) {
      case '24h':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    exportMutation.mutate({
      linkId,
      format: 'csv',
      dateRange: {
        start: startDate,
        end: endDate
      }
    });
  };

  return (
    <Button
      onClick={handleExport}
      disabled={isExporting}
      variant="outline"
      size="sm"
    >
      {isExporting ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Exporting...
        </>
      ) : (
        <>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </>
      )}
    </Button>
  );
});