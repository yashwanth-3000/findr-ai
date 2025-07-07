import { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Navbar } from '@/components/navbar'

export const metadata: Metadata = {
  title: 'Page Not Found | findr-ai',
  description: 'The page you are looking for does not exist.',
}

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center pt-20">
        <div className="container max-w-md py-16 text-center">
          <h1 className="text-6xl font-bold text-destructive mb-4">404</h1>
          <h2 className="text-2xl font-semibold mb-3">page not found</h2>
          <p className="text-muted-foreground mb-8">
            the page you are looking for doesn't exist or has been moved.
          </p>
          
          <div className="flex flex-col gap-3 sm:flex-row justify-center">
            <Button asChild>
              <Link href="/">
                return home
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/signin">
                sign in
              </Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
} 