import { useAuth } from './useAuth';

export type UserRole = 'owner' | 'staff';

/**
 * Hook to get the current user's role.
 * Role is stored in Supabase user_metadata during registration.
 * The first user who registers a business is the 'owner'.
 * Users invited/added later default to 'staff'.
 */
export function useRole() {
  const { user, loading } = useAuth();

  const role: UserRole = (user?.user_metadata?.role as UserRole) || 'staff';
  const isOwner = role === 'owner';
  const isStaff = role === 'staff';

  return { role, isOwner, isStaff, loading };
}
