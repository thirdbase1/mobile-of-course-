-- Promote admin@mozosubz.xyz to admin
UPDATE public.profiles 
SET is_admin = true, admin_role = 'ADMIN'
WHERE email = 'admin@mozosubz.xyz';

-- Verify the update
SELECT id, email, is_admin, admin_role FROM public.profiles WHERE email = 'admin@mozosubz.xyz';
