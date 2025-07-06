"use client";

import { useEffect, useState } from "react";
import { getTotalUsers } from "@/lib/actions/stats";
import { Users } from 'lucide-react';
import { useTranslation } from "@/hooks/useTranslation";
import { Skeleton } from "@/components/ui/skeleton";

export function TotalUsers() {
  const [userCount, setUserCount] = useState<number | null>(null);
  const { t, isReady } = useTranslation();

  useEffect(() => {
    const fetchUserCount = async () => {
      // Try to get from cache first
      const cachedData = localStorage.getItem("learnmint_user_count");
      if (cachedData) {
        try {
            const { count, timestamp } = JSON.parse(cachedData);
            // Use cache if it's less than an hour old
            if (Date.now() - timestamp < 3600000) {
                setUserCount(count);
                return;
            }
        } catch (e) {
            // Invalid cache, fetch new data
            localStorage.removeItem("learnmint_user_count");
        }
      }

      // Fetch fresh data if no cache or cache is old
      try {
        const count = await getTotalUsers();
        const baseCount = Math.max(count, 1384); // Ensure count doesn't go below a base number
        setUserCount(baseCount);
        localStorage.setItem("learnmint_user_count", JSON.stringify({ count: baseCount, timestamp: Date.now() }));
      } catch (error) {
         console.error("Failed to fetch user count for component:", error);
         setUserCount(1384); // Fallback on error
      }
    };

    if (isReady) {
      fetchUserCount();
    }
  }, [isReady]);

  if (!isReady) {
    return <Skeleton className="h-6 w-48 mx-auto mt-4" />;
  }
  
  return (
    <div className="text-sm text-center text-muted-foreground mt-4 flex items-center justify-center gap-2">
      {userCount !== null ? (
        <>
            <Users className="h-4 w-4" />
            <span className="font-semibold">{t('dashboard.totalLearners', { count: userCount.toLocaleString() })}</span>
        </>
      ) : (
        <Skeleton className="h-6 w-48" />
      )}
    </div>
  );
}
