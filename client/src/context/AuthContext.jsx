import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext();
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
});

const normalizeApiError = (err, fallbackMessage) => {
    if (err?.response?.data?.message) return err.response.data.message;
    if (err?.code === 'ECONNABORTED') return 'Request timed out. Please try again.';
    if (err?.message === 'Network Error') {
        return `Cannot connect to server (${API_BASE_URL}). Please start backend and try again.`;
    }
    return fallbackMessage;
};

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (token) {
            api.defaults.headers.common['x-auth-token'] = token;
            fetchUser();
        } else {
            setLoading(false);
        }
    }, [token]);

    const fetchUser = async () => {
        try {
            const res = await api.get('/api/auth/me');
            setUser(res.data);
        } catch (err) {
            console.error('Fetch user error:', err);
            logout();
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        try {
            const res = await api.post('/api/auth/login', { email, password });
            const { token, user } = res.data;
            localStorage.setItem('token', token);
            setToken(token);
            setUser(user);
            return user;
        } catch (err) {
            throw new Error(normalizeApiError(err, 'Invalid email or password'));
        }
    };

    const register = async (userData) => {
        try {
            const res = await api.post('/api/auth/register', userData);
            const { token, user } = res.data;
            localStorage.setItem('token', token);
            setToken(token);
            setUser(user);
            return user;
        } catch (err) {
            throw new Error(normalizeApiError(err, 'Registration failed. Please try again.'));
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
        delete api.defaults.headers.common['x-auth-token'];
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
