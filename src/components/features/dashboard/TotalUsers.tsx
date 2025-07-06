
"use client";

import { useQuery } from '@tanstack/react-query';
import { getTotalUsers } from "@/lib/actions/stats";
import { Users, AlertTriangle } from 'lucide-react';
import { useTranslation } from "@/hooks/useTranslation";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from '@/lib/utils';

export function TotalUsers() {
  const { t } = useTranslation();

  const { data: userCount, isLoading, isError, error } = useQuery<number, Error>({
    queryKey: ['totalUsers'],
    queryFn: getTotalUsers,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes before re-fetching
    refetchOnWindowFocus: true, // Re-fetch when the user returns to the tab
  });

  if (isLoading) {
    return (
      <div className="mt-4 flex justify-center">
        <Skeleton className="h-7 w-48" />
      </div>
    );
  }

  if (isError) {
    console.error("TotalUsers component error:", error.message);
    return (
       <div className="flex items-center justify-center gap-2 text-sm text-destructive mt-4" title={error.message}>
          <AlertTriangle className="h-4 w-4" />
          <span>Could not load learner count.</span>
      </div>
    );
  }
  
  if (userCount !== null && userCount !== undefined) {
    return (
      <div 
        className={cn(
          "mt-4 flex cursor-default items-center justify-center gap-2 text-lg font-bold text-green-400 transition-all duration-300",
          "hover:scale-105 hover:brightness-125",
          "[text-shadow:0_0_10px_theme(colors.green.400/0.6)]"
        )}
      >
        <Users className="h-5 w-5" />
        <span>{t('dashboard.totalLearners', { count: userCount.toLocaleString() })}</span>
      </div>
    );
  }

  return null;
}
