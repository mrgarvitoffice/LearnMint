
import { redirect } from 'next/navigation';

/**
 * This component performs a server-side redirect from the root of the (app) group
 * to the main dashboard. This resolves a build-time routing conflict with src/app/page.tsx.
 */
export default function AppRootRedirect() {
  redirect('/dashboard');
}
