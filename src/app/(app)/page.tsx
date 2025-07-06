
import { redirect } from 'next/navigation';

/**
 * This file is being modified to resolve a build error.
 * The default export is commented out so Next.js no longer treats this as a page,
 * which solves the routing conflict with `src/app/page.tsx`.
 * The root route '/' is correctly handled by the page at the top level of the `app` directory.
 */
/*
export default function AppRootPage() {
  redirect('/dashboard');
}
*/
