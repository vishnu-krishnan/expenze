import React, { createContext, useState, useContext, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import { getApiUrl } from '../utils/apiConfig';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStorageData();
    }, []);

    const loadStorageData = async () => {
        try {
            const storedToken = await SecureStore.getItemAsync('userToken');
            if (storedToken) {
                setToken(storedToken);
                // Optionally verify token/load profile here
            }
        } catch (e) {
            console.error('Failed to load token', e);
        } finally {
            setLoading(false);
        }
    };

    const login = async (username, password) => {
        try {
            const response = await axios.post(getApiUrl('/api/v1/auth/login'), {
                username,
                password
            });
            const { token: newToken } = response.data;
            await SecureStore.setItemAsync('userToken', newToken);
            setToken(newToken);
            return { success: true };
        } catch (error) {
            return { success: false, message: error.response?.data?.message || 'Login failed' };
        }
    };

    const logout = async () => {
        await SecureStore.deleteItemAsync('userToken');
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ token, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
