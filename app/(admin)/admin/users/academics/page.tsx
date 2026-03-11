import { redirect } from 'next/navigation';

export default async function AcademicsPage() {
  // Redirect to main site users page
  redirect('/admin');
}
