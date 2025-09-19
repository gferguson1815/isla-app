import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { HomeIcon, SearchIcon } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full px-6 py-8 text-center">
        <div className="mb-8">
          <h1 className="text-6xl font-bold text-foreground mb-2">404</h1>
          <h2 className="text-2xl font-semibold text-foreground mb-4">
            Link Not Found
          </h2>
          <p className="text-muted-foreground mb-8">
            The link you&apos;re looking for doesn&apos;t exist or may have expired.
          </p>
        </div>

        <div className="space-y-4">
          <Button asChild className="w-full">
            <Link href="/">
              <HomeIcon className="mr-2 h-4 w-4" />
              Go to Homepage
            </Link>
          </Button>

          <Button asChild variant="outline" className="w-full">
            <Link href="/dashboard">
              <SearchIcon className="mr-2 h-4 w-4" />
              Go to Dashboard
            </Link>
          </Button>
        </div>

        <div className="mt-8 pt-8 border-t border-border">
          <p className="text-sm text-muted-foreground">
            If you believe this is an error, please contact the link owner.
          </p>
        </div>
      </div>
    </div>
  );
}