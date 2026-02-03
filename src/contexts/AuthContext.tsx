import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Organization, UserRole } from '@/types';
import { api } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  organization: Organization | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: { email: string; password: string; firstName: string; lastName: string; organizationName: string }) => Promise<void>;
  logout: () => void;
  updateProfile: (data: { firstName?: string; lastName?: string; avatarUrl?: string }) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  hasRole: (roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock data for demo purposes
const mockUser: User = {
  id: '1',
  email: 'admin@salesconnect.io',
  firstName: 'Alex',
  lastName: 'Johnson',
  role: 'OWNER',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockOrganization: Organization = {
  id: '1',
  name: 'Acme Sales Team',
  slug: 'acme-sales',
  plan: 'Professional',
  subscriptionStatus: 'ACTIVE',
  messageLimit: 10000,
  messagesUsed: 3247,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    const token = api.getToken();
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      // For demo, use mock data
      // const { user, organization } = await api.auth.me();
      setUser(mockUser);
      setOrganization(mockOrganization);
    } catch (error) {
      api.setToken(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // For demo, accept any credentials
      // const { user, organization, token } = await api.auth.login(email, password);
      api.setToken('demo-token');
      setUser(mockUser);
      setOrganization(mockOrganization);
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (data: { email: string; password: string; firstName: string; lastName: string; organizationName: string }) => {
    setIsLoading(true);
    try {
      // For demo, simulate signup
      // const { user, organization, token } = await api.auth.signup(data);
      api.setToken('demo-token');
      setUser({
        ...mockUser,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
      });
      setOrganization({
        ...mockOrganization,
        name: data.organizationName,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    api.setToken(null);
    setUser(null);
    setOrganization(null);
  };

  const updateProfile = async (data: { firstName?: string; lastName?: string; avatarUrl?: string }) => {
    if (!user) return;
    // await api.auth.updateProfile(data);
    setUser({ ...user, ...data });
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    // await api.auth.changePassword({ currentPassword, newPassword });
  };

  const hasRole = (roles: UserRole[]) => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        organization,
        isLoading,
        isAuthenticated: !!user,
        login,
        signup,
        logout,
        updateProfile,
        changePassword,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
