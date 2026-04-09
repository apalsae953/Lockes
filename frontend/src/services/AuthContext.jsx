import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

// Configuración base de Axios
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'https://lockes.onrender.com', withCredentials: true,
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

    const login = async (credentials) => {
        // CSRF cookie debe pedirse siempre a la raíz, no a /api/
        const rootUrl = (import.meta.env.VITE_API_URL || 'https://lockes.onrender.com').replace(/\/api\/?$/, '');
        await axios.get(`${rootUrl}/sanctum/csrf-cookie`, { withCredentials: true });
        
        const response = await api.post('/api/login', credentials);
        setUser(response.data.user);
        return response.data;
    };

    const register = async (userData) => {
        const rootUrl = (import.meta.env.VITE_API_URL || 'https://lockes.onrender.com').replace(/\/api\/?$/, '');
        await axios.get(`${rootUrl}/sanctum/csrf-cookie`, { withCredentials: true });
        
        const response = await api.post('/api/register', userData);
        setUser(response.data.user);
        return response.data;
    };

    const logout = async () => {
        const rootUrl = (import.meta.env.VITE_API_URL || 'https://lockes.onrender.com').replace(/\/api\/?$/, '');
        await axios.get(`${rootUrl}/sanctum/csrf-cookie`, { withCredentials: true });
        
        await api.post('/api/logout');
        setUser(null);
    };

    const updateProfile = async (data) => {
        const rootUrl = (import.meta.env.VITE_API_URL || 'https://lockes.onrender.com').replace(/\/api\/?$/, '');
        await axios.get(`${rootUrl}/sanctum/csrf-cookie`, { withCredentials: true });
        
        const response = await api.put('/api/profile', data);
        setUser(response.data.user);
        return response.data;
    };

    const loginWithGoogle = () => {
        // Obtenemos la URL base (sin el prefijo /api si lo tuviera)
        const rawUrl = import.meta.env.VITE_API_URL || 'https://lockes.onrender.com';
        const baseUrl = rawUrl.endsWith('/api') ? rawUrl.slice(0, -4) : rawUrl;
        
        window.location.href = `${baseUrl}/auth/google`;
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout, loginWithGoogle, checkUser, updateProfile }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
export default api;
