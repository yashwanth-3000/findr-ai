-- Creates a stored procedure to safely create a user profile
-- This can be called by RLS-limited contexts

-- Check if the function already exists and drop it if it does
DROP FUNCTION IF EXISTS public.create_user_profile;

CREATE OR REPLACE FUNCTION public.create_user_profile(
  user_id uuid,
  user_role text DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if the profile already exists
  IF EXISTS (SELECT 1 FROM user_profiles WHERE id = user_id) THEN
    -- Optionally update the role if provided
    IF user_role IS NOT NULL THEN
      UPDATE user_profiles 
      SET role = user_role 
      WHERE id = user_id;
    END IF;
    
    RETURN TRUE;
  END IF;

  -- Profile doesn't exist, create a new one
  INSERT INTO user_profiles (
    id,
    role,
    created_at
  ) VALUES (
    user_id,
    user_role,
    now()
  );
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error creating user profile: %', SQLERRM;
    RETURN FALSE;
END;
$$; 