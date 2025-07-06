import { redirect } from 'next/navigation';

export default function AppRootPage() {
  redirect('/dashboard');
  
  // This return is needed to satisfy the function signature, 
  // but it will never be reached due to the redirect.
  return null;
}
