'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function PasswordProtectedLink() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/verify-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ slug, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Set cookie and redirect
        document.cookie = `link-auth-${slug}=${data.token}; path=/; max-age=3600`; // 1 hour
        window.location.href = `/api/r/${slug}`;
      } else {
        setError(data.error || 'Incorrect password');
        setPassword('');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
            <Lock className="w-8 h-8 text-gray-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Password Required
          </h1>
          <p className="text-gray-600">
            This link is protected. Enter the password to continue.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="sr-only">
              Password
            </label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="pr-10"
                required
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 hover:bg-gray-100 rounded transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-500" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-500" />
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={isLoading || !password}
            className="w-full bg-gray-900 hover:bg-gray-800 text-white"
          >
            {isLoading ? (
              'Verifying...'
            ) : (
              <>
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Protected with{' '}
            <a
              href="https://isla.so"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-gray-700 hover:text-gray-900"
            >
              isla.so
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}