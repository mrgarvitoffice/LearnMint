
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

/**
 * Root Page for the (app) group
 *
 * This component is now a redirector to ensure that the primary dashboard
 * is served from a single, unambiguous route: '/dashboard'.
 * If a user somehow lands at the root while inside the authenticated app layout,
 * they will be seamlessly redirected.
 */
export default function AppRootRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard');
  }, [router]);

  // Provide a loading state while redirecting
  return (
    <div className="flex flex-1 items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
