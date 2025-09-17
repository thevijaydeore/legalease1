-- Fix security warning by setting search_path for the function
CREATE OR REPLACE FUNCTION public.create_guest_session()
RETURNS json 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
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
$$;