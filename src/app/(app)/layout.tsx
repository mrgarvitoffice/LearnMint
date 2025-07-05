"use client";

import type { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, LogIn } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

function NotAuthenticatedScreen() {
    return (
        <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4 text-foreground">
            <Card className="w-full max-w-md text-center shadow-xl bg-card/90 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className="text-2xl text-primary">Access Denied</CardTitle>
                    <CardDescription>
                        You need to be signed in to view this page.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="mb-6 text-muted-foreground">
                        Please sign in or continue as a guest to access LearnMint.
                    </p>
                    <Button asChild size="lg">
                        <Link href="/sign-in">
                            <LogIn className="mr-2 h-4 w-4" /> Go to Sign In Page
                        </Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}

export default function MainAppLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background text-foreground">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="mt-3 text-lg">Verifying your session...</p>
      </div>
    );
  }

  if (user) {
    return <AppLayout>{children}</AppLayout>;
  }

  // If not loading and no user, show the access denied screen.
  // This is the gatekeeper for all pages inside the (app) group.
  return <NotAuthenticatedScreen />;
}
