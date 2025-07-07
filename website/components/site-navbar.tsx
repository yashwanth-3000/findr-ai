'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { useAuth } from '@/contexts/auth-context'
import { LogOut, Settings, User, Menu, Building, Users, BarChart3 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function SiteNavbar() {
  const [isOpen, setIsOpen] = useState(false)
  const { user, company, signOut } = useAuth()
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  // Get initials for avatar fallback
  const getInitials = (name?: string) => {
    if (!name) return 'U'
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // Check if user is on company dashboard
  const isOnCompanyDashboard = typeof window !== 'undefined' && window.location.pathname.startsWith('/company')

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        {/* Logo */}
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <div className="font-bold text-xl bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              findr-ai
            </div>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          {/* Desktop user menu */}
          {user ? (
            <div className="hidden md:flex items-center space-x-4">
              {/* Company navigation if authenticated */}
              {company && (
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/company/dashboard">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Dashboard
                    </Link>
                  </Button>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/company/jobs">
                      <Users className="h-4 w-4 mr-2" />
                      Jobs
                    </Link>
                  </Button>
                </div>
              )}

              <ThemeToggle />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      {user.user_metadata?.avatar_url ? (
                        <AvatarImage src={user.user_metadata.avatar_url} alt={user.user_metadata?.full_name || 'User'} />
                      ) : (
                        <AvatarFallback>{getInitials(user.user_metadata?.full_name || company?.company_name)}</AvatarFallback>
                      )}
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium">{company?.company_name || user.user_metadata?.full_name || 'User'}</p>
                      <p className="text-xs text-muted-foreground">{company?.company_email || user.email}</p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/company/profile">
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  {company && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href="/company/dashboard">
                          <BarChart3 className="mr-2 h-4 w-4" />
                          <span>Dashboard</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/company/jobs">
                          <Users className="mr-2 h-4 w-4" />
                          <span>Jobs</span>
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <div className="hidden md:flex items-center space-x-4">
              <ThemeToggle />
              <Button variant="ghost" asChild>
                <Link href="/auth/sign-in">Sign In</Link>
              </Button>
            </div>
          )}

          {/* Mobile menu */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                className="mr-2 px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="pr-0">
              <SheetHeader>
                <SheetTitle>
                  <Link href="/" className="flex items-center space-x-2" onClick={() => setIsOpen(false)}>
                    <div className="font-bold text-lg bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                      findr-ai
                    </div>
                  </Link>
                </SheetTitle>
                <SheetDescription>
                  AI-powered hiring platform for modern companies
                </SheetDescription>
              </SheetHeader>

              <div className="my-4 h-[calc(100vh-8rem)] pb-10">
                <div className="flex flex-col space-y-3">
                  {user ? (
                    <>
                      {/* User info */}
                      <div className="flex items-center space-x-2 px-3 py-2 border rounded-lg">
                        <Avatar className="h-8 w-8">
                          {user.user_metadata?.avatar_url ? (
                            <AvatarImage src={user.user_metadata.avatar_url} alt={user.user_metadata?.full_name || 'User'} />
                          ) : (
                            <AvatarFallback>{getInitials(user.user_metadata?.full_name || company?.company_name)}</AvatarFallback>
                          )}
                        </Avatar>
                        <div className="flex flex-col">
                          <p className="font-medium">{company?.company_name || user.user_metadata?.full_name || 'User'}</p>
                          <p className="text-xs text-muted-foreground">{company?.company_email || user.email}</p>
                        </div>
                      </div>

                      {/* Navigation links */}
                      {company && (
                        <>
                          <Button variant="ghost" className="justify-start" asChild>
                            <Link href="/company/dashboard" onClick={() => setIsOpen(false)}>
                              <BarChart3 className="mr-2 h-4 w-4" />
                              Dashboard
                            </Link>
                          </Button>
                          <Button variant="ghost" className="justify-start" asChild>
                            <Link href="/company/jobs" onClick={() => setIsOpen(false)}>
                              <Users className="mr-2 h-4 w-4" />
                              Jobs
                            </Link>
                          </Button>
                        </>
                      )}

                      <Button variant="ghost" className="justify-start" asChild>
                        <Link href="/company/profile" onClick={() => setIsOpen(false)}>
                          <User className="mr-2 h-4 w-4" />
                          Profile
                        </Link>
                      </Button>

                      <Button variant="ghost" className="justify-start" onClick={handleSignOut}>
                        <LogOut className="mr-2 h-4 w-4" />
                        Sign Out
                      </Button>
                    </>
                  ) : (
                    <Button variant="ghost" className="justify-start" asChild>
                      <Link href="/auth/sign-in" onClick={() => setIsOpen(false)}>
                        Sign In
                      </Link>
                    </Button>
                  )}

                  <div className="flex items-center justify-between px-3 py-2">
                    <span className="text-sm">Theme</span>
                    <ThemeToggle />
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  )
} 