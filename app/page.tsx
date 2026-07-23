import { redirect } from 'next/navigation';
import { getAuthedUser } from '@/lib/supabase/server';

export default async function RootPage() {
  const user = await getAuthedUser();
  redirect(user ? '/dashboard' : '/login');
}
