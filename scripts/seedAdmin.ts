import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredVars = [
  'VITE_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY', // This should be the service role key, not the anon key
  'ADMIN_EMAIL',
  'ADMIN_PASSWORD'
];

for (const envVar of requiredVars) {
  if (!process.env[envVar]) {
    console.error(`❌ Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const adminEmail = process.env.ADMIN_EMAIL!;
const adminPassword = process.env.ADMIN_PASSWORD!;

// Create a client with the service role key
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function seedAdmin() {
  try {
    console.log('🚀 Starting admin user creation...');
    
    // Check if admin user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', adminEmail)
      .maybeSingle();

    let userId: string;

    if (existingUser) {
      console.log('ℹ️  Admin user already exists, updating role...');
      userId = existingUser.id;
    } else {
      // Create new auth user
      console.log('🔑 Creating new auth user...');
      const { data: authData, error: signUpError } = await supabase.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true, // Skip email confirmation
        user_metadata: {
          full_name: 'Super Admin',
          is_admin: true
        }
      });

      if (signUpError) {
        throw new Error(`Error creating auth user: ${signUpError.message}`);
      }

      userId = authData.user.id;
      console.log(`✅ Auth user created with ID: ${userId}`);
    }

    // Check if user already has admin role
    const { data: existingRole, error: roleCheckError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle();

    if (existingRole) {
      console.log('ℹ️  User already has admin role');
    } else {
      // Assign admin role
      console.log('👑 Assigning admin role...');
      const { error: roleError } = await supabase
        .from('user_roles')
        .upsert(
          {
            user_id: userId,
            role: 'admin',
            assigned_by: userId,
            assigned_at: new Date().toISOString()
          },
          { onConflict: 'user_id,role' }
        );

      if (roleError) {
        throw new Error(`Error assigning admin role: ${roleError.message}`);
      }
      console.log('✅ Admin role assigned successfully');
    }

    // Create or update profile
    console.log('👤 Creating/updating user profile...');
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert(
        {
          id: userId,
          email: adminEmail,
          full_name: 'Super Admin',
          phone: null,
          address: null,
          avatar_url: null,
          updated_at: new Date().toISOString()
        },
        { onConflict: 'id' }
      );

    if (profileError) {
      console.warn(`⚠️  Warning: Could not update profile: ${profileError.message}`);
    } else {
      console.log('✅ Profile updated successfully');
    }

    console.log('\n🎉 Admin user setup completed successfully!');
    console.log(`📧 Email: ${adminEmail}`);
    console.log(`🔑 Password: ${adminPassword}`);
    console.log('\n⚠️  IMPORTANT: Change the admin password after first login!');
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  }
}

// Run the seed function
seedAdmin();
