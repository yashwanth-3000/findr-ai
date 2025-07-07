import { Metadata } from 'next'
import { Navbar } from '@/components/navbar'
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase'

export const metadata: Metadata = {
  title: 'Edit Company Profile',
  description: 'Update your company profile information',
}

export default async function CompanyProfileEditPage() {
  // Server-side check for user's role
  const supabase = createServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    // If no session, redirect to sign in
    redirect('/signin')
  }
  
  // Check if the user is a company
  const { data: userProfile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', session.user.id)
    .single()
  
  if (userProfile?.role !== 'company') {
    // If not a company, redirect to the role selection page
    redirect('/role-select')
  }
  
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 pt-20">
        <div className="container py-12">
          <h1 className="text-3xl font-bold mb-8">Edit Company Profile</h1>
          
          <div className="bg-white rounded-lg border shadow-sm p-6">
            <p className="text-center text-gray-500 py-10">
              Company profile edit form will be implemented here. <br />
              Coming soon!
            </p>
          </div>
        </div>
      </main>
    </div>
  )
} 