"use client";

import { useQuery } from '@tanstack/react-query';
import { getTotalUsers } from "@/lib/actions/stats";
import { Users, AlertTriangle } from 'lucide-react';
import { useTranslation } from "@/hooks/useTranslation";
import { Skeleton } from "@/components/ui/skeleton";

export function TotalUsers() {
  const { t } = useTranslation();

  const { data: userCount, isLoading, isError, error } = useQuery<number, Error>({
    queryKey: ['totalUsers'],
    queryFn: getTotalUsers,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes before re-fetching
    refetchOnWindowFocus: true, // Re-fetch when the user returns to the tab
  });

  const displayContent = () => {
    if (isLoading) {
      return <Skeleton className="h-6 w-48" />;
    }

    if (isError) {
      console.error("TotalUsers component error:", error.message);
      // Display a more user-friendly error. The detailed error is in the console.
      return (
         <div className="flex items-center gap-2 text-xs text-destructive" title={error.message}>
            <AlertTriangle className="h-4 w-4" />
            <span>Could not load learner count.</span>
        </div>
      );
    }
    
    if (userCount !== null && userCount !== undefined) {
      return (
        <>
            <Users className="h-4 w-4" />
            <span className="font-semibold">{t('dashboard.totalLearners', { count: userCount.toLocaleString() })}</span>
        </>
      );
    }

    return null; // Should not be reached if logic is correct
  };

  return (
    <div className="text-sm text-center text-muted-foreground mt-4 flex items-center justify-center gap-2">
      {displayContent()}
    </div>
  );
}
