-- Create a guest user account in auth.users (this will be our default guest profile)
-- Insert guest user directly into auth.users table
-- Note: We'll use a specific email that we can reference

-- First, let's create a function to handle guest user creation and login
CREATE OR REPLACE FUNCTION public.create_guest_session()
RETURNS json AS $$
DECLARE
    guest_user_id uuid := '00000000-0000-0000-0000-000000000001';
    result json;
BEGIN
    -- Check if guest user profile exists, create if not
    INSERT INTO public.profiles (id, user_id, full_name, display_name, created_at, updated_at)
    VALUES (
        guest_user_id,
        guest_user_id,
        'Guest User',
        'Guest',
        now(),
        now()
    )
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Return guest user info
    SELECT json_build_object(
        'user_id', guest_user_id,
        'email', 'guest@legalease.app',
        'full_name', 'Guest User',
        'display_name', 'Guest'
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;