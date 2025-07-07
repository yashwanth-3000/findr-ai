import { createServerClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerClient()
    const body = await req.json()
    const { userId } = body
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }
    
    // Verify the user exists in Supabase auth
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId)
    
    if (userError || !userData?.user) {
      console.error('Error verifying user:', userError || 'User not found')
      return NextResponse.json(
        { error: userError?.message || 'User not found' },
        { status: 404 }
      )
    }
    
    const user = userData.user
    const now = new Date().toISOString()
    
    // Check if user profile already exists
    const { data: existingProfile, error: profileQueryError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('id', userId)
      .single()
    
    if (existingProfile) {
      console.log('Profile already exists for user:', userId)
      return NextResponse.json({
        message: 'Profile already exists',
        profile: existingProfile
      })
    }
    
    // Extract display name from metadata or email
    let displayName = ''
    if (user.user_metadata?.full_name) {
      displayName = user.user_metadata.full_name
    } else if (user.user_metadata?.name) {
      displayName = user.user_metadata.name
    } else if (user.email) {
      displayName = user.email.split('@')[0]
    }
    
    // Create the profile directly using raw SQL for maximum reliability
    // This bypasses RLS policies which might be causing issues
    const { data: insertResult, error: insertError } = await supabase.rpc(
      'admin_create_user_profile',
      {
        user_id: userId,
        user_email: user.email,
        display_name: displayName,
        avatar_url: user.user_metadata?.avatar_url || null
      }
    )
    
    if (insertError) {
      console.error('Error creating profile via RPC:', insertError)
      
      // Try direct insert as a fallback
      const { data: directInsert, error: directError } = await supabase
        .from('user_profiles')
        .insert({
          id: userId,
          email: user.email,
          display_name: displayName,
          avatar_url: user.user_metadata?.avatar_url || null,
          created_at: now,
          updated_at: now
        })
        .select('*')
        .single()
      
      if (directError) {
        console.error('Error creating profile directly:', directError)
        return NextResponse.json(
          { error: directError.message },
          { status: 500 }
        )
      }
      
      return NextResponse.json({
        message: 'Profile created via direct insert',
        profile: directInsert
      })
    }
    
    return NextResponse.json({
      message: 'Profile created successfully',
      success: true
    })
  } catch (error) {
    console.error('Profile creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create user profile' },
      { status: 500 }
    )
  }
} 