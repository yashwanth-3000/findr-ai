import { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Container } from './container'

interface PageContainerProps {
  children: ReactNode
  className?: string
  fluid?: boolean
}

/**
 * PageContainer component for consistent page layouts
 * Applies top padding to account for the fixed navbar and adds consistent horizontal padding
 */
export function PageContainer({ 
  children, 
  className,
  fluid = false
}: PageContainerProps) {
  return (
    <main className={cn("flex-1 pt-24 pb-12", className)}>
      <Container fluid={fluid}>
        {children}
      </Container>
    </main>
  )
} 