
import type { ImgHTMLAttributes } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface LogoProps extends ImgHTMLAttributes<HTMLImageElement> {
  size?: number;
}

export function Logo({ size = 24, className, ...props }: LogoProps) {
  return (
    <Image
      src="/icons/icon-192x192.png"
      alt="Nexithra Logo"
      width={size}
      height={size}
      className={cn(className)}
      priority // Ensures logo loads quickly, good for LCP
      {...props}
    />
  );
}
