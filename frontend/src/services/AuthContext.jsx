import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

// Configuración base de Axios
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/', withCredentials: true,
    withXSRFToken: true, // Crucial para versiones modernas de Axios + Sanctum
    xsrfCookieName: 'XSRF-TOKEN',
    xsrfHeaderName: 'X-XSRF-TOKEN',
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
    }
});

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const checkUser = async () => {
        try {
            const response = await api.get('/api/me');
            setUser(response.data.user);
        } catch (error) {
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        checkUser();
    }, []);

    const getCsrfCookie = async () => {
        await api.get('/sanctum/csrf-cookie');
    };

    const login = async (credentials) => {
        await getCsrfCookie();
        const response = await api.post('/api/login', credentials);
        setUser(response.data.user);
        return response.data;
    };

    const register = async (userData) => {
        await getCsrfCookie();
        const response = await api.post('/api/register', userData);
        setUser(response.data.user);
        return response.data;
    };

    const logout = async () => {
        await getCsrfCookie();
        await api.post('/api/logout');
        setUser(null);
    };

    const updateProfile = async (data) => {
        await getCsrfCookie();
        const response = await api.put('/api/profile', data);
        setUser(response.data.user);
        return response.data;
    };

    const loginWithGoogle = () => {
        window.location.href = "/auth/google";
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout, loginWithGoogle, checkUser, updateProfile }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
export default api;
