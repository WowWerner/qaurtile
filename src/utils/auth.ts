import { supabase } from '../lib/supabase';

export interface User {
  id: string;
  email: string;
  role: 'user' | 'admin' | 'super_admin';
  isSuperAdmin: boolean;
}

export class AuthService {
  // Sign in with email and password
  static async signIn(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      // Get user role and super admin status
      const userProfile = await this.getUserProfile(data.user.id);
      
      return {
        user: data.user,
        session: data.session,
        profile: userProfile
      };
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  }

  // Sign out
  static async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }

  // Get current user
  static async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) return null;

    const userProfile = await this.getUserProfile(user.id);
    
    return {
      user,
      profile: userProfile
    };
  }

  // Get user profile with role information
  static async getUserProfile(userId: string): Promise<User> {
    try {
      // Check if user is super admin
      const { data: isSuperAdmin } = await supabase
        .rpc('is_super_admin', { user_uuid: userId });

      // Get user role
      const { data: role } = await supabase
        .rpc('get_user_role', { user_uuid: userId });

      // Get user email
      const { data: { user } } = await supabase.auth.getUser();

      return {
        id: userId,
        email: user?.email || '',
        role: role || 'user',
        isSuperAdmin: isSuperAdmin || false
      };
    } catch (error) {
      console.error('Get user profile error:', error);
      return {
        id: userId,
        email: '',
        role: 'user',
        isSuperAdmin: false
      };
    }
  }

  // Check authentication status
  static async isAuthenticated(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      return !!user;
    } catch (error) {
      return false;
    }
  }

  // Check if current user is super admin
  static async isSuperAdmin(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data: isSuperAdmin } = await supabase
        .rpc('is_super_admin', { user_uuid: user.id });

      return isSuperAdmin || false;
    } catch (error) {
      console.error('Check super admin error:', error);
      return false;
    }
  }

  // Listen to auth state changes
  static onAuthStateChange(callback: (authenticated: boolean, user: User | null) => void) {
    return supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const profile = await this.getUserProfile(session.user.id);
        callback(true, profile);
      } else {
        callback(false, null);
      }
    });
  }
}