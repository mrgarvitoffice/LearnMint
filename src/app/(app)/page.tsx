
"use server";

import { redirect } from 'next/navigation';

/**
 * This page is part of the '(app)' route group.
 * Its purpose is to redirect users from a base '/app' route (if they land there)
 * to the main application dashboard, which is the intended starting point for authenticated users.
 * This has been converted to a server component for a more efficient redirect.
 */
export default function AppRootPage() {
  redirect('/dashboard');
}
