import { useContext } from 'react';
import { AuthContext, AuthContextType } from './useAuth';

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
