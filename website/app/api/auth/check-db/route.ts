import { createServerClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const supabase = createServerClient()
    
    // Test database connection with the check_db_connection function
    const { data: connectionCheck, error: connectionError } = await supabase.rpc('check_db_connection')
    
    if (connectionError) {
      return NextResponse.json({
        success: false,
        error: 'Database connection error',
        details: connectionError
      })
    }
    
    // Test table access for user_profiles
    const { data: userProfilesTest, error: userProfilesError } = await supabase
      .from('user_profiles')
      .select('count(*)', { count: 'exact', head: true })
    
    // Test table access for applicant_profiles
    const { data: applicantProfilesTest, error: applicantProfilesError } = await supabase
      .from('applicant_profiles')
      .select('count(*)', { count: 'exact', head: true })
    
    // Test table access for company_profiles
    const { data: companyProfilesTest, error: companyProfilesError } = await supabase
      .from('company_profiles')
      .select('count(*)', { count: 'exact', head: true })
    
    return NextResponse.json({
      success: true,
      connection: {
        connected: !!connectionCheck,
        status: connectionCheck
      },
      tables: {
        user_profiles: {
          accessible: !userProfilesError,
          error: userProfilesError ? userProfilesError.message : null
        },
        applicant_profiles: {
          accessible: !applicantProfilesError,
          error: applicantProfilesError ? applicantProfilesError.message : null
        },
        company_profiles: {
          accessible: !companyProfilesError,
          error: companyProfilesError ? companyProfilesError.message : null
        }
      }
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Server error checking database',
      details: error instanceof Error ? error.message : String(error)
    })
  }
} 