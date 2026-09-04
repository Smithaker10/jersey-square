import { create } from 'zustand';
import type { User } from '@supabase/supabase-js';
import type { UserProfile } from '@/types/auth';
import { useCartStore } from './cartStore';

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  initialized: boolean;
  accessToken: string | null;
  init: () => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    fullName: string,
    phone: string,
  ) => Promise<{ needsEmailVerification: boolean }>;
  signOut: () => Promise<void>;
  updateProfile: (fullName: string, phone: string) => Promise<void>;
}

const LOCAL_ACCOUNTS_KEY = 'jerseysquare_local_accounts';
const LOCAL_SESSION_KEY = 'jerseysquare_local_session';

interface LocalAccount {
  id: string;
  email: string;
  password?: string;
  fullName: string;
  phone: string;
  createdAt: string;
}

function getLocalAccounts(): LocalAccount[] {
  try {
    const data = localStorage.getItem(LOCAL_ACCOUNTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveLocalAccount(account: LocalAccount) {
  try {
    const accounts = getLocalAccounts();
    const existingIdx = accounts.findIndex((a) => a.email.toLowerCase() === account.email.toLowerCase());
    if (existingIdx > -1) {
      accounts[existingIdx] = account;
    } else {
      accounts.push(account);
    }
    localStorage.setItem(LOCAL_ACCOUNTS_KEY, JSON.stringify(accounts));
  } catch (e) {
    console.error('Failed to save local account', e);
  }
}

function getLocalSession(): { user: User; profile: UserProfile; accessToken: string } | null {
  try {
    const data = localStorage.getItem(LOCAL_SESSION_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

function setLocalSession(user: User, profile: UserProfile, accessToken: string) {
  try {
    localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify({ user, profile, accessToken }));
  } catch (e) {
    console.error('Failed to set local session', e);
  }
}

function clearLocalSession() {
  try {
    localStorage.removeItem(LOCAL_SESSION_KEY);
  } catch (e) {
    console.error('Failed to clear local session', e);
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  loading: false,
  initialized: false,
  accessToken: null,

  init: () => {
    if (get().initialized) return;

    const local = getLocalSession();
    if (local) {
      set({
        user: local.user,
        profile: local.profile,
        accessToken: local.accessToken,
        loading: false,
        initialized: true,
      });
      useCartStore.getState().loadCart();
    } else {
      set({ loading: false, initialized: true });
    }
  },

  signIn: async (email, password) => {
    set({ loading: true });

    try {
      const accounts = getLocalAccounts();
      const userAcc = accounts.find((a) => a.email.toLowerCase() === email.trim().toLowerCase());

      let userId: string;
      let fullName: string;
      let phone: string;
      let createdAt: string;

      if (userAcc) {
        userId = userAcc.id;
        fullName = userAcc.fullName;
        phone = userAcc.phone;
        createdAt = userAcc.createdAt;
      } else {
        userId = `user-${Date.now()}`;
        const namePart = email.split('@')[0].replace(/[^a-zA-Z]/g, ' ');
        fullName = namePart ? namePart.charAt(0).toUpperCase() + namePart.slice(1) : 'Customer';
        phone = '';
        createdAt = new Date().toISOString();

        saveLocalAccount({
          id: userId,
          email: email.trim(),
          password,
          fullName,
          phone,
          createdAt,
        });
      }

      const mockUser: any = {
        id: userId,
        email: email.trim(),
        aud: 'authenticated',
        created_at: createdAt,
        user_metadata: { full_name: fullName, phone },
      };
      const mockProfile: UserProfile = {
        id: userId,
        fullName,
        email: email.trim(),
        phone,
        createdAt,
      };
      const token = `local-demo-token-${userId}`;

      setLocalSession(mockUser, mockProfile, token);
      set({
        user: mockUser,
        profile: mockProfile,
        accessToken: token,
        loading: false,
      });
      useCartStore.getState().loadCart();
    } catch (err: any) {
      throw new Error(err.message || 'Failed to sign in');
    } finally {
      set({ loading: false });
    }
  },

  signUp: async (email, password, fullName, phone) => {
    set({ loading: true });

    try {
      const id = `user-${Date.now()}`;
      const createdAt = new Date().toISOString();
      const mockUser: any = {
        id,
        email: email.trim(),
        aud: 'authenticated',
        created_at: createdAt,
        user_metadata: { full_name: fullName, phone },
      };
      const mockProfile: UserProfile = {
        id,
        fullName,
        email: email.trim(),
        phone,
        createdAt,
      };
      const token = `local-demo-token-${id}`;

      saveLocalAccount({
        id,
        email: email.trim(),
        password,
        fullName,
        phone,
        createdAt,
      });

      setLocalSession(mockUser, mockProfile, token);
      set({
        user: mockUser,
        profile: mockProfile,
        accessToken: token,
        loading: false,
      });
      useCartStore.getState().loadCart();
      return { needsEmailVerification: false };
    } catch (err: any) {
      throw new Error(err.message || 'Failed to create account');
    } finally {
      set({ loading: false });
    }
  },

  signOut: async () => {
    clearLocalSession();
    set({
      user: null,
      profile: null,
      accessToken: null,
      loading: false,
    });
    useCartStore.getState().clear();
  },

  updateProfile: async (fullName, phone) => {
    const user = get().user;
    if (!user) throw new Error('You must be logged in to update your profile');
    set({ loading: true });
    try {
      const updatedProfile: UserProfile = get().profile
        ? { ...get().profile!, fullName, phone }
        : { id: user.id, fullName, email: user.email || '', phone, createdAt: new Date().toISOString() };

      const currentToken = get().accessToken || `local-demo-token-${user.id}`;
      setLocalSession(user, updatedProfile, currentToken);

      const accounts = getLocalAccounts();
      const existing = accounts.find((a) => a.id === user.id);
      if (existing) {
        existing.fullName = fullName;
        existing.phone = phone;
        saveLocalAccount(existing);
      }

      set({ profile: updatedProfile });
    } finally {
      set({ loading: false });
    }
  },
}));
