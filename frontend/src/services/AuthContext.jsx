import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

// Configuración base de Axios
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/',
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
    }
});

// Interceptor para añadir el Token en cada petición
api.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
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
        const response = await api.post('/api/login', credentials);
        if (response.data.token) {
            localStorage.setItem('token', response.data.token);
        }
        setUser(response.data.user);
        return response.data;
    };

    const register = async (userData) => {
        const response = await api.post('/api/register', userData);
        if (response.data.token) {
            localStorage.setItem('token', response.data.token);
        }
        setUser(response.data.user);
        return response.data;
    };

    const logout = async () => {
        try {
            await api.post('/api/logout');
        } catch (error) {
            console.error('Error al cerrar sesión en el servidor:', error);
        } finally {
            localStorage.removeItem('token');
            setUser(null);
        }
    };

    const updateProfile = async (data) => {
        const response = await api.put('/api/profile', data);
        setUser(response.data.user);
        return response.data;
    };

    const forgotPassword = async (email) => {
        const response = await api.post('/api/forgot-password', { email });
        return response.data;
    };

    const resetPassword = async (data) => {
        const response = await api.post('/api/reset-password', data);
        return response.data;
    };

    const loginWithGoogle = () => {
        // Usamos la URL base de la API para redirigir al backend
        const backendUrl = import.meta.env.VITE_API_URL || '';
        // Si backendUrl es relativa (ej: /), se queda igual. 
        // Si es absoluta (ej: http://localhost:8000), redirige correctamente.
        window.location.href = `${backendUrl}/auth/google`;
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout, loginWithGoogle, checkUser, updateProfile, forgotPassword, resetPassword }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
export default api;
