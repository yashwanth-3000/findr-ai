import { createServerClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerClient()
    const body = await req.json()
    const { email, password, userData = {} } = body
    
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }
    
    // Create the user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          ...userData
        }
      }
    })
    
    if (authError) {
      console.error('Error during signup:', authError)
      return NextResponse.json(
        { error: authError.message },
        { status: 500 }
      )
    }
    
    // If sign-up succeeded, make sure the user profile is created
    if (authData.user) {
      const userId = authData.user.id
      const now = new Date().toISOString()
      
      // First, check if a profile already exists
      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('id', userId)
        .single()
      
      // If no profile exists, create one
      if (!existingProfile) {
        // Extract display name from user metadata or email
        let displayName = ''
        if (userData.full_name) {
          displayName = userData.full_name
        } else if (email) {
          displayName = email.split('@')[0]
        }
        
        // Create the profile
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert({
            id: userId,
            email,
            display_name: displayName,
            created_at: now,
            updated_at: now
          })
        
        if (profileError) {
          console.error('Error creating user profile:', profileError)
          // Don't fail the request, just log the error
          // The client-side will attempt to create the profile again when needed
        }
      }
    }
    
    // Return success response
    return NextResponse.json({
      message: 'Signup successful',
      user: authData.user
    })
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'Failed to create user account' },
      { status: 500 }
    )
  }
} 