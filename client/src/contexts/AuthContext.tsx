import React, { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

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
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is authenticated on app load
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        try {
          const response = await fetch('/api/auth/verify', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            setUser(data.user);
          } else {
            // Token is invalid, remove it
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user_id');
            localStorage.removeItem('auth_type');
          }
        } catch (error) {
          console.error('Auth verification error:', error);
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user_id');
          localStorage.removeItem('auth_type');
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Login failed');
    }

    const data = await response.json();
    setUser(data.user);
    localStorage.setItem('auth_token', data.token);
    localStorage.setItem('user_id', data.user.id.toString());
    localStorage.setItem('auth_type', 'registered');
  };

  const register = async (email: string, password: string, name: string) => {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, name }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Registration failed');
    }

    const data = await response.json();
    setUser(data.user);
    localStorage.setItem('auth_token', data.token);
    localStorage.setItem('user_id', data.user.id.toString());
    localStorage.setItem('auth_type', 'registered');
  };

  const logout = async () => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      } catch (error) {
        console.error('Logout error:', error);
      }
    }

    setUser(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('auth_type');
  };

  const migrateAnonymousUser = async (anonymousUserId: number, email: string, password: string, name: string) => {
    const response = await fetch('/api/auth/migrate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ anonymousUserId, email, password, name }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Migration failed');
    }

    const data = await response.json();
    setUser(data.user);
    localStorage.setItem('auth_token', data.token);
    localStorage.setItem('user_id', data.user.id.toString());
    localStorage.setItem('auth_type', 'registered');
  };

  const value = {
    user,
    isLoading,
    login,
    register,
    logout,
    migrateAnonymousUser,
    isAuthenticated: !!user && !user.isAnonymous,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
