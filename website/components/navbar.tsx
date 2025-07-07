"use client";

import { useTheme } from "next-themes";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Moon, Sun, Menu, BriefcaseBusiness, BarChart3 } from "lucide-react";
import { useEffect, useState } from "react";
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { LuMenu, LuX, LuLogOut, LuLoader, LuUser, LuBuilding } from 'react-icons/lu'
import { forceSignOut, debugAuthState, serverSignOut } from '@/lib/auth-utils'
import { Container } from '@/components/layout/container'

export function Navbar() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname()
  const { user, signOut } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Get initial for avatar
  const getInitials = (name: string | undefined | null): string => {
    if (!name || name === 'User') {
      // Get first letter of email if available, otherwise default to 'U'
      if (user?.email) {
        return user.email.substring(0, 1).toUpperCase();
      }
      return 'U';
    }
    
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  // Get display name in a consistent way
  const getDisplayName = (): string => {
    // Fallback to user email (first part)
    if (user?.email) {
      return user.email.split('@')[0];
    }
    
    // Last resort
    return 'User';
  }
  
  // Handle sign out with fallback options
  const handleSignOut = (e: React.MouseEvent) => {
    // If shift key is pressed, show auth debug info
    if (e.shiftKey) {
      e.preventDefault();
      debugAuthState();
      return;
    }
    
    // If ctrl/cmd key is pressed, use force sign out
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      forceSignOut();
      return;
    }
    
    // Regular sign out - use the server endpoint
    setIsSubmitting(true);
    console.log("Starting sign out process using server endpoint");
    serverSignOut();
  };

  // Navigation links for authenticated companies
  const navLinks = user ? [
    { name: "Dashboard", path: "/company/dashboard", icon: BarChart3 },
    { name: "Jobs", path: "/company/jobs", icon: BriefcaseBusiness },
  ] : [];

  return (
    <nav 
      className={cn(
        "fixed top-0 w-full z-50 transition-all duration-500 border-b",
        scrolled
          ? "bg-background/80 backdrop-blur-lg border-border/20 shadow-sm h-16"
          : "bg-background/30 backdrop-blur-sm border-transparent h-20"
      )}
    >
      <Container className="flex items-center justify-between h-full">
        {/* Logo and site name */}
        <Link href="/" className="flex items-center space-x-2 group">
          <div className="flex items-center justify-center w-8 h-8 overflow-hidden rounded-lg bg-primary text-primary-foreground font-bold text-xl group-hover:opacity-80 transition-all duration-300">
            AI
          </div>
          <span className="font-bold text-lg group-hover:text-primary transition-colors duration-300">
            findr-ai
          </span>
        </Link>

        {/* Middle navigation links for authenticated users */}
        <div className="hidden md:flex items-center space-x-6">
          {navLinks.map((item, index) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name} 
                href={item.path}
                className={cn(
                  "group relative px-3 py-2 text-sm font-medium transition-colors rounded-lg",
                  pathname === item.path
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <span className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  {item.name}
                </span>
              </Link>
            );
          })}
        </div>

        {/* Right side actions */}
        <div className="flex items-center space-x-3">
          {/* Theme toggle */}
          {mounted && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label="Toggle theme"
              className="relative h-9 w-9 rounded-full transition-colors duration-300 hover:bg-background hover:text-primary"
            >
              <span className="sr-only">Toggle theme</span>
              <div className="flex items-center justify-center w-full h-full">
                <Sun className={cn(
                  "absolute h-[1.3rem] w-[1.3rem] transition-all duration-300",
                  theme === "dark" 
                    ? "opacity-100 text-amber-200" 
                    : "opacity-0"
                )} />
                <Moon className={cn(
                  "absolute h-[1.3rem] w-[1.3rem] transition-all duration-300",
                  theme === "dark" 
                    ? "opacity-0" 
                    : "opacity-100 text-slate-900 dark:text-slate-400"
                )} />
              </div>
            </Button>
          )}
          
          {/* Auth items */}
          {!user ? (
            // Sign in button for non-authenticated users
            <Button asChild variant="default">
              <Link href="/auth/sign-in">Sign In</Link>
            </Button>
          ) : (
            // User dropdown for authenticated users
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.user_metadata?.avatar_url} alt="Avatar" />
                    <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                      {getInitials(getDisplayName())}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium">{getDisplayName()}</p>
                    <p className="w-[200px] truncate text-sm text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/company/profile" className="cursor-pointer">
                    <LuUser className="mr-2 h-4 w-4" />
                    Company Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/company/dashboard" className="cursor-pointer">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer text-red-600 focus:text-red-600"
                  onClick={handleSignOut}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <LuLoader className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <LuLogOut className="mr-2 h-4 w-4" />
                  )}
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle mobile menu"
              className="h-9 w-9"
            >
              {isMobileMenuOpen ? (
                <LuX className="h-5 w-5" />
              ) : (
                <LuMenu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </Container>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-background border-b shadow-lg">
          <div className="container py-4 space-y-3">
            {navLinks.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.path}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 text-sm font-medium transition-colors rounded-lg",
                    pathname === item.path
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Icon className="h-4 w-4" />
                  {item.name}
                </Link>
              );
            })}
            
            {!user && (
              <div className="pt-3 border-t">
                <Button asChild className="w-full">
                  <Link href="/auth/sign-in" onClick={() => setIsMobileMenuOpen(false)}>
                    Sign In
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
} 