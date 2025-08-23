
"use client";
/**
 * @fileoverview Renders the top navigation bar for mobile devices.
 * This component includes the application logo and a settings dropdown menu,
 * which consolidates user profile actions and global application settings like
 * theme, language, and sound.
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { TOP_NAV_ITEMS } from '@/lib/constants';
import { useSound } from '@/hooks/useSound';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';
import { Logo } from '../icons/Logo';
import { motion } from 'framer-motion';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from '@/components/ui/dropdown-menu';
import { Button } from '../ui/button';
import { Settings, School } from 'lucide-react';
import SettingsMenuContent from './SettingsMenuContent';
import ProfileMenuContent from './ProfileMenuContent';
import Assistant from '../features/assistant/Assistant';

export function TopMobileNav() {
  const pathname = usePathname();
  const { playSound } = useSound('/sounds/ting.mp3', { priority: 'incidental' });
  const { t } = useTranslation();

  return (
    <header className="fixed top-0 left-0 right-0 z-40 md:hidden border-b bg-background/90 backdrop-blur-lg">
      <div className="flex h-16 items-center justify-between px-4">
        <motion.div whileTap={{ scale: 0.95 }}>
            <Link href="/" className="flex items-center gap-2.5 font-semibold">
                <motion.div whileHover={{ scale: 1.1, rotate: 5 }} transition={{ type: "spring", stiffness: 300 }}>
                    <Logo size={32} />
                </motion.div>
                <span className="font-bold text-xl text-foreground whitespace-nowrap">
                  Nexithra
                </span>
            </Link>
        </motion.div>
        
        <div className="flex items-center gap-2">
            <Assistant />
            <Button asChild variant="outline" size="icon">
                <Link href="/college">
                    <School className="h-5 w-5" />
                </Link>
            </Button>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Settings className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" sideOffset={8}>
                    <div className="p-2 w-64">
                        <ProfileMenuContent />
                        <div className="mt-2 pt-2 border-t">
                            <SettingsMenuContent />
                        </div>
                    </div>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </div>
      
      {/* This secondary navigation bar provides quick access to key features on mobile. */}
      <div className="flex h-16 items-center overflow-x-auto px-2 border-t border-border/50">
        <nav className="flex w-full items-center justify-around text-sm font-medium">
          {TOP_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = (item.href !== '/' && pathname.startsWith(item.href)) || pathname === item.href;
            const title = t(item.title);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={playSound}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 p-1 w-16 text-muted-foreground transition-colors hover:bg-muted/50 hover:text-primary group",
                  isActive && "text-primary [text-shadow:0_0_8px_hsl(var(--primary))]"
                )}
              >
                <Icon className="h-6 w-6 transition-transform duration-200 group-hover:scale-110" />
                <span className="text-[10px] font-medium leading-tight text-center break-words">{title}</span>
              </Link>
            );
          })}
        </nav>
      </div>

    </header>
  );
}
