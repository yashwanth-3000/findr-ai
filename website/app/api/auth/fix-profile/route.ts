import { createServerClient } from '@/lib/supabase'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    // Get the Supabase client
    const supabase = createServerClient()
    
    // Get the current authenticated user's session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      console.error('No authenticated user found:', sessionError)
      return NextResponse.json(
        { error: 'Authentication required', details: sessionError?.message },
        { status: 401 }
      )
    }
    
    const userId = session.user.id
    
    console.log(`Fixing profile for user: ${userId}`)
    
    // Check if a profile already exists for this user
    const { data: existingProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, role')
      .eq('id', userId)
      .maybeSingle()
    
    if (profileError) {
      console.error('Error checking for existing profile:', profileError)
      return NextResponse.json(
        { error: 'Database error', details: profileError.message },
        { status: 500 }
      )
    }
    
    // Create role data from request body if provided, otherwise null
    let roleData = null
    try {
      const body = await req.json()
      roleData = body.role || null
    } catch (e) {
      // No body or invalid JSON - continue with null role
    }
    
    // If profile exists, update it with role if provided
    if (existingProfile) {
      console.log(`Existing profile found for ${userId}, updating if needed`)
      
      // If role was provided and different from current, update it
      if (roleData && existingProfile.role !== roleData) {
        const { error: updateError } = await supabase
          .from('user_profiles')
          .update({ role: roleData })
          .eq('id', userId)
        
        if (updateError) {
          console.error('Error updating profile role:', updateError)
          return NextResponse.json(
            { error: 'Failed to update profile', details: updateError.message },
            { status: 500 }
          )
        }
        
        return NextResponse.json({
          success: true,
          message: 'Profile updated with new role',
          profile: { id: userId, role: roleData }
        })
      }
      
      // Profile exists and no changes needed
      return NextResponse.json({
        success: true,
        message: 'Profile exists, no changes needed',
        profile: existingProfile
      })
    }
    
    // No profile found, create a new one
    console.log(`No profile found for ${userId}, creating new profile`)
    
    const { data: newProfile, error: createError } = await supabase
      .from('user_profiles')
      .insert([
        {
          id: userId,
          role: roleData,
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single()
    
    if (createError) {
      console.error('Error creating new profile:', createError)
      
      // Try the RLS-compatible RPC method as fallback
      try {
        const { data: rpcResult, error: rpcError } = await supabase.rpc('create_user_profile', {
          user_id: userId,
          user_role: roleData
        })
        
        if (rpcError) {
          throw rpcError
        }
        
        return NextResponse.json({
          success: true,
          message: 'Profile created via RPC',
          profile: { id: userId, role: roleData }
        })
      } catch (rpcErr: any) {
        console.error('RPC fallback also failed:', rpcErr)
        return NextResponse.json(
          { error: 'Failed to create profile', details: createError.message, rpcError: rpcErr.message },
          { status: 500 }
        )
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'New profile created',
      profile: newProfile
    })
  } catch (error: any) {
    console.error('Unexpected error in fix-profile:', error)
    return NextResponse.json(
      { error: 'Server error', details: error.message },
      { status: 500 }
    )
  }
} 