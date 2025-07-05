
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { TOP_NAV_ITEMS } from '@/lib/constants';
import { useSound } from '@/hooks/useSound';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';
import { Logo } from '../icons/Logo';
import { motion } from 'framer-motion';
import { Header } from './Header'; // This now includes settings and the avatar.

export function TopMobileNav() {
  const pathname = usePathname();
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
                  LearnMint
                </span>
            </Link>
        </motion.div>
        
        {/* Header now includes the settings dropdown AND the user avatar */}
        <Header />
      </div>
    </header>
  );
}
