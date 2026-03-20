// AuthContext — thin bridge to Zustand useAuthStore
// Pages that import { useAuth } from '../context/AuthContext' keep working.
import { createContext } from 'react';
import { useAuthStore } from '../store';

const AuthContext = createContext(null);

// AuthProvider is a no-op shell — Zustand handles state persistence.
export const AuthProvider = ({ children }) => children;

// useAuth() delegates to the Zustand store for full compatibility
export const useAuth = () => useAuthStore();

export default AuthContext;
