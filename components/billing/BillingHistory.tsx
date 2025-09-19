'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Download, FileText, Receipt } from 'lucide-react';
import { format } from 'date-fns';
import { trpc } from '@/lib/trpc/client';
import { toast } from 'sonner';

interface BillingHistoryProps {
  workspaceId: string;
}

export default function BillingHistory({ workspaceId }: BillingHistoryProps) {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const { 
    data, 
    isLoading, 
    fetchNextPage,
    hasNextPage 
  } = trpc.billing.getInvoices.useInfiniteQuery(
    { 
      workspaceId,
      limit: 10,
    },
    {
      enabled: !!workspaceId,
      getNextPageParam: (lastPage, pages) => {
        if (!lastPage.hasMore) return undefined;
        return pages.length * 10; // offset
      },
    }
  );

  const handleDownloadInvoice = async (invoiceId: string, stripeInvoiceId: string) => {
    setDownloadingId(invoiceId);
    try {
      // In a real implementation, this would call a tRPC endpoint
      // that fetches the PDF from Stripe and returns it
      const response = await fetch(`/api/invoices/${stripeInvoiceId}/download`);
      if (!response.ok) throw new Error('Failed to download invoice');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${stripeInvoiceId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Invoice downloaded successfully');
    } catch (error) {
      toast.error('Failed to download invoice');
    } finally {
      setDownloadingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      paid: 'default',
      open: 'secondary',
      uncollectible: 'destructive',
      void: 'outline',
    };

    return (
      <Badge variant={variants[status] || 'outline'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const invoices = data?.pages.flatMap(page => page.invoices) || [];

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5" />
              Billing History
            </CardTitle>
            <CardDescription>
              View and download your past invoices
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : invoices.length > 0 ? (
          <div className="space-y-4">
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell>
                        {format(new Date(invoice.created_at), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-muted-foreground" />
                          <span>Monthly subscription</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        ${(invoice.amount_paid / 100).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(invoice.status)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownloadInvoice(invoice.id, invoice.stripe_invoice_id)}
                          disabled={downloadingId === invoice.id}
                        >
                          {downloadingId === invoice.id ? (
                            'Downloading...'
                          ) : (
                            <>
                              <Download className="w-4 h-4 mr-1" />
                              Download
                            </>
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {hasNextPage && (
              <div className="flex justify-center pt-4">
                <Button
                  variant="outline"
                  onClick={() => fetchNextPage()}
                >
                  Load more invoices
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <Receipt className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No billing history yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Your invoices will appear here after your first payment
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}