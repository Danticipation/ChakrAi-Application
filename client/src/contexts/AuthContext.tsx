import React, { createContext, useContext, useState, ReactNode } from 'react';

interface User {
  id: number;
  email: string;
  displayName: string;
  isAnonymous: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  migrateAnonymousUser: (anonymousUserId: number, email: string, password: string, name: string) => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false); // Simplified - no initial auth check

  const login = async (email: string, password: string) => {
    // Simplified login - can be enhanced later
    console.log('Login attempted:', email);
  };

  const register = async (email: string, password: string, name: string) => {
    // Simplified register - can be enhanced later
    console.log('Register attempted:', email, name);
  };

  const logout = async () => {
    setUser(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('auth_type');
  };

  const migrateAnonymousUser = async (anonymousUserId: number, email: string, password: string, name: string) => {
    // Simplified migration - can be enhanced later
    console.log('Migration attempted:', anonymousUserId, email, name);
  };

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    register,
    logout,
    migrateAnonymousUser,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};