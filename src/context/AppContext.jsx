import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import { mapCurrentUser, mapMember } from '../lib/mappers';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [house, setHouse] = useState(null);
  const [members, setMembers] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadHouseData = useCallback(async () => {
    try {
      const [houseRes, membersRes, notifRes] = await Promise.all([
        api.getMyHouse(),
        api.getHouseMembers(),
        api.getUnreadCount().catch(() => ({ data: { count: 0 } })),
      ]);
      setHouse(houseRes.data);
      setMembers((membersRes.data || []).map(mapMember));
      setUnreadCount(notifRes.data?.count || 0);
    } catch {
      setHouse(null);
      setMembers([]);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    const res = await api.getMe();
    setUser(res.data);
    return res.data;
  }, []);

  const login = useCallback(async (email, password) => {
    setError(null);
    const res = await api.login(email, password);
    api.setToken(res.accessToken);
    setUser(res.user);
    if (res.user?.house) {
      await loadHouseData();
    } else {
      setHouse(null);
      setMembers([]);
    }
    return res.user;
  }, [loadHouseData]);

  const register = useCallback(async (name, email, password) => {
    setError(null);
    const res = await api.register(name, email, password);
    api.setToken(res.accessToken);
    setUser(res.user);
    setHouse(null);
    setMembers([]);
    return res.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } catch {
      // ignore — token may already be invalid
    }
    api.setToken(null);
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    setUser(null);
    setHouse(null);
    setMembers([]);
    setUnreadCount(0);
    setError(null);
  }, []);

  useEffect(() => {
    const onForcedLogout = () => {
      api.setToken(null);
      setUser(null);
      setHouse(null);
      setMembers([]);
      setUnreadCount(0);
      setError('Session expired. Please sign in again.');
    };
    window.addEventListener('auth:logout', onForcedLogout);
    return () => window.removeEventListener('auth:logout', onForcedLogout);
  }, []);

  useEffect(() => {
    async function init() {
      setLoading(true);
      setError(null);
      try {
        if (api.getToken()) {
          await refreshUser();
          await loadHouseData();
        }
      } catch (err) {
        api.setToken(null);
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userName');
        setUser(null);
        setError(err.message || 'Session expired. Please sign in again.');
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [loadHouseData, refreshUser]);

  const currentUser = useMemo(() => mapCurrentUser(user, house), [user, house]);
  const isAuthenticated = !!user && !!api.getToken();

  const value = useMemo(
    () => ({
      user,
      house,
      members,
      currentUser,
      unreadCount,
      setUnreadCount,
      loading,
      error,
      isAuthenticated,
      login,
      register,
      logout,
      refreshUser,
      loadHouseData,
      currentUserId: user?._id,
    }),
    [
      user,
      house,
      members,
      currentUser,
      unreadCount,
      loading,
      error,
      isAuthenticated,
      login,
      register,
      logout,
      refreshUser,
      loadHouseData,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
