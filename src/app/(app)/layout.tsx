
"use client";

import type { ReactNode } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';

export default function MainAppLayout({ children }: { children: ReactNode }) {
  // This layout simply wraps its children with the AppLayout component.
  // It no longer contains any gatekeeper logic.
  // Authentication-based UI changes are handled within components themselves.
  return <AppLayout>{children}</AppLayout>;
}
