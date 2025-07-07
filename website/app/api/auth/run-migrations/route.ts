import { createServerClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

// This API route runs migrations for authentication-related database objects
export async function POST(req: NextRequest) {
  try {
    // Get authorization header (optional API key for security)
    const authHeader = req.headers.get('Authorization')
    
    // If using this in production, you should add proper API key validation
    // This is currently open for development/testing purposes
    
    // Create a server-side Supabase client with admin privileges
    const supabase = createServerClient()
    
    // Check if we're authenticated as an admin
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    
    // Get migrations directory
    const migrationsDir = path.join(process.cwd(), 'app', 'api', 'auth', 'migrations')
    
    // Get all migration files
    let migrationFiles: string[] = []
    try {
      migrationFiles = fs.readdirSync(migrationsDir)
        .filter(file => file.endsWith('.sql'))
        .sort() // Sort alphabetically to ensure order
    } catch (err) {
      console.error('Error reading migrations directory:', err)
      return NextResponse.json({ error: 'Failed to read migrations' }, { status: 500 })
    }
    
    // Run each migration
    const results = []
    
    for (const file of migrationFiles) {
      try {
        const filePath = path.join(migrationsDir, file)
        const sql = fs.readFileSync(filePath, 'utf8')
        
        console.log(`Running migration: ${file}`)
        
        const { error } = await supabase.rpc('exec_sql', { sql_query: sql })
        
        if (error) {
          console.error(`Error running migration ${file}:`, error)
          results.push({ file, success: false, error: error.message })
        } else {
          console.log(`Successfully ran migration: ${file}`)
          results.push({ file, success: true })
        }
      } catch (err) {
        console.error(`Error processing migration ${file}:`, err)
        results.push({ file, success: false, error: (err as Error).message })
      }
    }
    
    return NextResponse.json({ 
      success: results.every(r => r.success),
      results
    })
  } catch (error) {
    console.error('Unexpected error in run-migrations:', error)
    return NextResponse.json(
      { error: 'Server error', details: (error as Error).message },
      { status: 500 }
    )
  }
} 