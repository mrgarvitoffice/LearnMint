
"use client";
/**
 * @fileoverview Renders the bottom navigation bar for mobile devices.
 * This component provides quick access to the five most essential features of the application,
 * ensuring a user-friendly experience on smaller screens.
 */
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BOTTOM_NAV_ITEMS } from '@/lib/constants';
import { useSound } from '@/hooks/useSound';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';

export function BottomMobileNav() {
  const pathname = usePathname();
  const { playSound } = useSound('/sounds/ting.mp3', { priority: 'incidental' });
  const { t } = useTranslation();

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/50 bg-background/90 backdrop-blur-lg md:hidden">
      <div className="grid h-16 grid-cols-5 items-center justify-around px-2">
        {BOTTOM_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = (item.href !== '/' && pathname.startsWith(item.href)) || pathname === item.href;
          const title = t(item.title);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex h-full flex-col items-center justify-center gap-1 rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted/50 hover:text-primary group",
                isActive && "text-primary [text-shadow:0_0_8px_hsl(var(--primary))]"
              )}
              onClick={playSound}
            >
              <Icon className="h-5 w-5 transition-transform duration-200 group-hover:scale-110" />
              <span className="text-[10px] font-medium leading-tight text-center break-words">{title}</span>
            </Link>
          );
        })}
      </div>
    </footer>
  );
}
