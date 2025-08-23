
"use client";
/**
 * @fileoverview Defines the main application layout structure.
 * This component wraps all authenticated pages, providing a consistent structure
 * with a sidebar for desktop and dedicated navigation bars for mobile.
 * It also includes a page transition loading overlay for a smoother user experience.
 */

import { type ReactNode, useState, useEffect, useRef, Suspense } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { DesktopSidebar } from '@/components/layout/DesktopSidebar';
import { TopMobileNav } from '@/components/layout/TopMobileNav';
import { BottomMobileNav } from '@/components/layout/BottomMobileNav';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { useSidebar } from '@/components/ui/sidebar';
import { Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function AppLayout({ children }: { children: ReactNode }) {
  const isMobile = useIsMobile();
  const { open } = useSidebar();
  const pathname = usePathname();
  const [isPageLoading, setIsPageLoading] = useState(false);
  const prevPathnameRef = useRef(pathname);

  useEffect(() => {
    if (prevPathnameRef.current !== pathname) {
      setIsPageLoading(true);
      const timer = setTimeout(() => {
        setIsPageLoading(false);
      }, 600); // Duration for the loading overlay
      prevPathnameRef.current = pathname;
      return () => clearTimeout(timer);
    }
  }, [pathname]);

  // The coding page handles its own full-screen layout.
  if (pathname === '/coding') {
    return <Suspense fallback={<div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>}>{children}</Suspense>;
  }

  const mainContent = (
    <motion.main
      key={pathname}
      className="w-full max-w-5xl mx-auto px-2 py-4 sm:px-4 flex-1 flex flex-col min-h-0" // Allow main to be a flex container
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
    >
      {children}
    </motion.main>
  );

  const loadingOverlay = (
    <AnimatePresence>
      {isPageLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm"
        >
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      {isMobile ? (
        <div className="flex min-h-screen flex-col">
          {loadingOverlay}
          <div className="no-print fixed top-0 left-0 right-0 z-40">
            <TopMobileNav />
          </div>
          {/* This corrected structure allows child pages to correctly manage their own scrolling. */}
          <div className="flex-1 flex flex-col min-h-0 pt-24 pb-16">
             {mainContent}
          </div>
          <div className="no-print fixed bottom-0 left-0 right-0 z-40">
            <BottomMobileNav />
          </div>
        </div>
      ) : (
        <div className="flex min-h-screen bg-transparent">
          {loadingOverlay}
          <div className="no-print">
            <DesktopSidebar />
          </div>
          <div className={cn(
            "flex flex-col flex-1 transition-all duration-300 ease-in-out min-w-0",
            open ? "md:ml-64" : "md:ml-20"
          )}>
            <div className="no-print">
              <Header />
            </div>
            <ScrollArea className="flex-1">
              <div className="flex justify-center w-full min-w-0 py-4">
                {mainContent}
              </div>
            </ScrollArea>
          </div>
        </div>
      )}
    </>
  );
}
