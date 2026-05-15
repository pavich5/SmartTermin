import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserType } from '../types/user';
import {
  login as loginRequest,
  signup as signupRequest,
  verifyPhone as verifyPhoneRequest,
  getCurrentUser,
  logout as logoutRequest,
} from '../services/authService';
import {
  clearStoredAuth,
  getStoredAuth,
  setStoredAuth,
  setOnboardingCompleted,
  clearOnboardingCompleted,
} from '../services/apiClient';
import { setupNotificationListener, unregisterFcmToken } from '../services/notificationService';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (phone: string, password: string) => Promise<User>;
  signup: (phone: string, password: string, fullName: string, userType: UserType) => Promise<void>;
  verifyPhone: (phone: string, code: string) => Promise<User>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
  refreshUser: () => Promise<void>;
  setAuth: (token: string, user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children?: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadAuth = async () => {
      try {
        const storedAuth = getStoredAuth();
        if (storedAuth?.token) {
          setToken(storedAuth.token);
          setUser(storedAuth.user);

          const storedOnboardingCompleted =
            storedAuth.user.isOnboardingCompleted ?? storedAuth.user.onboardingCompleted ?? false;
          if (storedOnboardingCompleted) {
            setOnboardingCompleted(true);
          }

          try {
            const freshUser = await getCurrentUser();
            setUser(freshUser);
            setStoredAuth({ token: storedAuth.token, user: freshUser });

            const freshOnboardingCompleted =
              freshUser.isOnboardingCompleted ?? freshUser.onboardingCompleted ?? false;
            if (freshOnboardingCompleted) {
              setOnboardingCompleted(true);
            } else {
              clearOnboardingCompleted();
            }
          } catch (error: any) {
            if (error?.status === 401 || error?.status === 403 || error?.status === 404) {
              // User not found (404) means account was deleted, clear auth
              console.error('User not found or authentication failed, clearing stored auth:', error);
              clearStoredAuth();
              clearOnboardingCompleted();
              setUser(null);
              setToken(null);
            } else {
              console.warn('Failed to refresh user data, using cached data:', error);
            }
          }
        }
      } catch (error) {
        console.error('Failed to load stored auth:', error);
        clearStoredAuth();
        clearOnboardingCompleted();
        setUser(null);
        setToken(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadAuth();
  }, []);

  // Set up foreground notification listener when user is authenticated
  useEffect(() => {
    if (user && token) {
      // Set up foreground notification listener (only works if permission granted)
      setupNotificationListener((payload) => {
        // Show notification using toast
        toast.info(payload.title, {
          description: payload.body,
          duration: 5000,
        });
      });
    }
  }, [user, token]);

  const login = async (phone: string, password: string) => {
    try {
      const auth = await loginRequest(phone, password);

      if (auth.isAccountDeactivated) {
        return {
          ...auth.user,
          isAccountDeactivated: true,
          userId: auth.userId,
        } as User & { isAccountDeactivated?: boolean; userId?: string };
      }

      setUser(auth.user);
      setToken(auth.token);
      setStoredAuth(auth);

      const onboardingCompleted =
        auth.user.isOnboardingCompleted ?? auth.user.onboardingCompleted ?? false;
      if (onboardingCompleted) {
        setOnboardingCompleted(true);
      } else {
        clearOnboardingCompleted();
      }

      // Note: Notification permission is now requested via modal after login
      // This ensures it happens with user interaction (required for mobile browsers)

      return auth.user;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const signup = async (
    phone: string,
    password: string,
    fullName: string,
    userType: UserType,
    email?: string
  ) => {
    try {
      await signupRequest(phone, password, fullName, userType, email);
    } catch (error) {
      console.error('Signup failed:', error);
      throw error;
    }
  };

  const verifyPhone = async (phone: string, code: string) => {
    const verification = await verifyPhoneRequest(phone, code);

    const token = verification.jwt || verification.Jwt;
    if (verification.verified && token) {
      setUser(verification.user);
      setToken(token);
      setStoredAuth({ token, user: verification.user });

      const onboardingCompleted =
        verification.user.isOnboardingCompleted ?? verification.user.onboardingCompleted ?? false;
      if (onboardingCompleted) {
        setOnboardingCompleted(true);
      } else {
        clearOnboardingCompleted();
      }

      // Note: Notification permission is now requested via modal after signup/verification
      // This ensures it happens with user interaction (required for mobile browsers)

      return verification.user;
    } else {
      console.error('Verification failed or no JWT:', {
        verified: verification.verified,
        hasJwt: !!token,
      });
      throw new Error('Verification failed');
    }
  };

  const logout = async () => {
    // Unregister FCM token before logging out
    try {
      await unregisterFcmToken();
    } catch (error) {
      console.error('Failed to unregister FCM token:', error);
    }
    
    await logoutRequest();
    setUser(null);
    setToken(null);
    clearStoredAuth();
    clearOnboardingCompleted();
  };

  const updateUser = (updates: Partial<User>) => {
    if (!user) return;

    const updatedUser = { ...user, ...updates };
    const stored = getStoredAuth();
    if (stored) {
      setStoredAuth({ token: stored.token, user: updatedUser });
    }
    setUser(updatedUser);

    if ('onboardingCompleted' in updates) {
      if (updates.onboardingCompleted) {
        setOnboardingCompleted(true);
      } else {
        clearOnboardingCompleted();
      }
    }
  };

  const setAuth = (authToken: string, authUser: User) => {
    setUser(authUser);
    setToken(authToken);
    setStoredAuth({ token: authToken, user: authUser });

    const onboardingCompleted =
      authUser.isOnboardingCompleted ?? authUser.onboardingCompleted ?? false;
    if (onboardingCompleted) {
      setOnboardingCompleted(true);
    } else {
      clearOnboardingCompleted();
    }
  };

  const refreshUser = async () => {
    const freshUser = await getCurrentUser();
    setUser(freshUser);
    const stored = getStoredAuth();
    if (stored?.token) {
      setStoredAuth({ token: stored.token, user: freshUser });
      setToken(stored.token);
    }

    const onboardingCompleted =
      freshUser.isOnboardingCompleted ?? freshUser.onboardingCompleted ?? false;
    if (onboardingCompleted) {
      setOnboardingCompleted(true);
    } else {
      clearOnboardingCompleted();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        signup,
        verifyPhone,
        logout,
        updateUser,
        refreshUser,
        setAuth,
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
