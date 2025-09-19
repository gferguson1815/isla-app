'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, CheckCircle, XCircle, UserPlus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { trpc } from '@/lib/trpc/client';
import { useAuth } from '@/contexts/auth-context';

export default function AcceptInvitationPage({
  params,
}: {
  params: { token: string };
}) {
  const router = useRouter();
  const { signIn, user } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'requiresAuth'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [workspaceName, setWorkspaceName] = useState<string>('');

  const acceptInvitation = trpc.workspace.acceptInvitation.useMutation({
    onSuccess: (data) => {
      setWorkspaceName(data.workspace.name);
      if (data.alreadyMember) {
        setStatus('success');
        setErrorMessage('You are already a member of this workspace');
      } else {
        setStatus('success');
      }
      // Redirect to workspace after 2 seconds
      setTimeout(() => {
        router.push(`/dashboard/${data.workspace.slug}`);
      }, 2000);
    },
    onError: (error) => {
      setStatus('error');
      setErrorMessage(error.message);
    },
  });

  useEffect(() => {
    const handleInvitation = async () => {
      if (!params.token) {
        setStatus('error');
        setErrorMessage('Invalid invitation link');
        return;
      }

      // Check if user is authenticated
      if (!user) {
        setStatus('requiresAuth');
        return;
      }

      // Accept invitation
      await acceptInvitation.mutateAsync({ token: params.token });
    };

    handleInvitation();
  }, [user, params.token, acceptInvitation]);

  const handleSignIn = async () => {
    // Store invitation token in localStorage to resume after auth
    localStorage.setItem('pendingInvitation', params.token);
    await signIn();
  };

  if (status === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
            <CardTitle>Processing Invitation</CardTitle>
            <CardDescription>
              Please wait while we verify your invitation...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (status === 'requiresAuth') {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
              <UserPlus className="h-8 w-8 text-blue-600" />
            </div>
            <CardTitle>Sign In Required</CardTitle>
            <CardDescription>
              Please sign in or create an account to accept this invitation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={handleSignIn} className="w-full" size="lg">
              Sign In to Accept Invitation
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              If you don&apos;t have an account, you can create one with the same email address
              that received the invitation.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle>Invitation Accepted!</CardTitle>
            <CardDescription>
              You&apos;ve successfully joined {workspaceName}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Redirecting you to the workspace dashboard...
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle>Invitation Error</CardTitle>
            <CardDescription>
              We couldn&apos;t process your invitation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
            <Button onClick={() => router.push('/dashboard')} className="w-full" variant="outline">
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}