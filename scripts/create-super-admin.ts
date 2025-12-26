// scripts/create-super-admin.ts
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function createSuperAdmin() {
  const email = process.env.SUPER_ADMIN_EMAIL || 'admin@trustycheck.com';
  const password = process.env.SUPER_ADMIN_PASSWORD || 'ChangeThisPassword123!';
  const fullName = process.env.SUPER_ADMIN_NAME || 'Super Admin';

  console.log('Creating super admin user...');
  console.log(`Email: ${email}`);
  console.log(`Name: ${fullName}`);

  try {
    // Create the user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        role: 'admin'
      }
    });

    if (authError) {
      if (authError.message.includes('User already exists')) {
        console.log('User already exists, retrieving existing user...');
        const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
        if (userError) {
          console.error('Error listing users:', userError);
          return;
        }
        
        const existingUser = users.find(user => user.email === email);
        if (!existingUser) {
          console.error('User not found after creation attempt');
          return;
        }
        
        console.log('Found existing user:', existingUser.id);
        await assignAdminRole(existingUser.id);
        return;
      } else {
        console.error('Error creating user:', authError);
        return;
      }
    }

    console.log('User created successfully:', authData.user?.id);

    // Assign admin role
    await assignAdminRole(authData.user?.id!);
    
  } catch (error) {
    console.error('Error creating super admin:', error);
  }
}

async function assignAdminRole(userId: string) {
  // Check if the user already has admin role
  const { data: existingRole } = await supabase
    .from('user_roles')
    .select('*')
    .eq('user_id', userId)
    .eq('role', 'admin')
    .single();

  if (existingRole) {
    console.log('User already has admin role');
    return;
  }

  // Insert admin role for the user
  const { error: roleError } = await supabase
    .from('user_roles')
    .insert({
      user_id: userId,
      role: 'admin',
      assigned_at: new Date().toISOString()
    });

  if (roleError) {
    console.error('Error assigning admin role:', roleError);
    return;
  }

  console.log('Admin role assigned successfully');

  // Update profile if it exists, or create it
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({
      id: userId,
      full_name: process.env.SUPER_ADMIN_NAME || 'Super Admin',
      updated_at: new Date().toISOString()
    });

  if (profileError) {
    console.error('Error updating profile:', profileError);
  } else {
    console.log('Profile updated successfully');
  }

  console.log('✅ Super admin setup completed successfully!');
  console.log(`📧 Email: ${process.env.SUPER_ADMIN_EMAIL || 'admin@trustycheck.com'}`);
  console.log(`🔑 Password: ${process.env.SUPER_ADMIN_PASSWORD || 'ChangeThisPassword123! (Change this after first login!)'}`);
}

// Run the function if this file is executed directly
if (require.main === module) {
  createSuperAdmin();
}

export { createSuperAdmin };