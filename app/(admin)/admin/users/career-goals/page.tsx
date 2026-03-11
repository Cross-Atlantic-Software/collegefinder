import { redirect } from 'next/navigation';

export default async function CareerGoalsPage() {
  // Redirect to main site users page
  redirect('/admin');
}
