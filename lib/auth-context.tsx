'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase, Profile } from './supabase';
import { Language, t as translate, TranslationKey } from './i18n';

type Theme = 'dark' | 'light' | 'midnight' | 'emerald';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  isAdmin: boolean;
  theme: Theme;
  language: Language;
  setTheme: (t: Theme) => void;
  setLanguage: (l: Language) => void;
  t: (key: TranslationKey) => string;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [theme, setThemeState] = useState<Theme>('dark');
  const [language, setLanguageState] = useState<Language>('en');

  const applyTheme = (t: Theme) => {
    if (typeof document === 'undefined') return;
    const html = document.documentElement;
    html.classList.remove('theme-dark', 'theme-light', 'theme-midnight', 'theme-emerald', 'dark');
    html.classList.add(`theme-${t}`);
    if (t !== 'light') html.classList.add('dark');
  };

  const setTheme = useCallback(async (t: Theme) => {
    setThemeState(t);
    applyTheme(t);
    localStorage.setItem('theme', t);
    if (user) {
      await supabase.from('profiles').update({ preferred_theme: t }).eq('id', user.id);
    }
  }, [user]);

  const setLanguage = useCallback(async (l: Language) => {
    setLanguageState(l);
    localStorage.setItem('language', l);
    document.documentElement.lang = l === 'ur' ? 'ur' : 'en';
    if (user) {
      await supabase.from('profiles').update({ preferred_language: l }).eq('id', user.id);
    }
  }, [user]);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
    if (data) {
      setProfile(data as Profile);
      if (data.preferred_theme) {
        setThemeState(data.preferred_theme as Theme);
        applyTheme(data.preferred_theme as Theme);
      }
      if (data.preferred_language) {
        setLanguageState(data.preferred_language as Language);
        document.documentElement.lang = data.preferred_language === 'ur' ? 'ur' : 'en';
      }
    }
  }, [user]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setProfile(null);
  }, []);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const savedTheme = (localStorage.getItem('theme') as Theme) || 'dark';
      const savedLang = (localStorage.getItem('language') as Language) || 'en';
      setThemeState(savedTheme);
      setLanguageState(savedLang);
      applyTheme(savedTheme);
      document.documentElement.lang = savedLang === 'ur' ? 'ur' : 'en';

      const { data: { session: s } } = await supabase.auth.getSession();
      if (!mounted) return;
      setSession(s);
      setUser(s?.user ?? null);

      if (s?.user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', s.user.id).maybeSingle();
        if (mounted && data) {
          setProfile(data as Profile);
          if (data.preferred_theme) {
            setThemeState(data.preferred_theme as Theme);
            applyTheme(data.preferred_theme as Theme);
          }
          if (data.preferred_language) {
            setLanguageState(data.preferred_language as Language);
            document.documentElement.lang = data.preferred_language === 'ur' ? 'ur' : 'en';
          }
        }
      }
      if (mounted) setLoading(false);
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      (async () => {
        if (!mounted) return;
        setSession(s);
        setUser(s?.user ?? null);
        if (!s?.user) {
          setProfile(null);
          setLoading(false);
        }
      })();
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const isAdmin = (user?.app_metadata?.role as string) === 'admin';

  const value: AuthContextType = {
    session, user, profile, loading, isAdmin,
    theme, language, setTheme, setLanguage,
    t: (key: TranslationKey) => translate(language, key),
    refreshProfile, signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
