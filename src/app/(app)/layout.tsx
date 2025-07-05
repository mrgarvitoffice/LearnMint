
"use client";

import type { ReactNode } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';

export default function MainAppLayout({ children }: { children: ReactNode }) {
  // The gatekeeper logic has been removed as per the request.
  // This layout now simply wraps its children with the AppLayout component.
  // Authentication checks can be handled within individual pages if needed,
  // and components within AppLayout (like Header/Sidebar) will adapt based on the auth state.
  return <AppLayout>{children}</AppLayout>;
}
