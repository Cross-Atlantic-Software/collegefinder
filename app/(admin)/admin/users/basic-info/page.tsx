import { redirect } from 'next/navigation';

export default async function BasicInfoPage() {
  // Redirect to main site users page
  redirect('/admin');
}
