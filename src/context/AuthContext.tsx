import * as React from 'react';
import { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/types';
import { authenticateUser, saveUser } from '@/utils/storage';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateSession: (user: User) => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for persisted user session
    const storedUser = localStorage.getItem('mediblink_current_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    const authenticatedUser = authenticateUser(email, password);
    if (authenticatedUser) {
      setUser(authenticatedUser);
      localStorage.setItem('mediblink_current_user', JSON.stringify(authenticatedUser));
    } else {
      throw new Error('Invalid email or password');
    }
  };

  const register = async (name: string, email: string, password: string) => {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    const newUser: User = {
      id: crypto.randomUUID(),
      name,
      email,
      password,
      role: 'patient',
    };
    
    saveUser(newUser);
    
    // Auto login after register
    const safeUser = { ...newUser, password: '' };
    setUser(safeUser);
    localStorage.setItem('mediblink_current_user', JSON.stringify(safeUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('mediblink_current_user');
    window.location.href = '/login';
  };

  const updateSession = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('mediblink_current_user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateSession, isLoading }}>
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
