import { redirect } from 'next/navigation';

export default async function AdminPage() {
  // Redirect to site users page (default route)
  redirect('/admin/site-users');
}


