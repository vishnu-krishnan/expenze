import { Platform } from 'react-native';

// Default to Android Emulator IP, change to your machine's IP for physical device
const API_BASE_URL = Platform.OS === 'android' ? 'http://10.0.2.2:8080' : 'http://localhost:8080';

export const getApiUrl = (path) => {
    return `${API_BASE_URL}${path}`;
};

export default API_BASE_URL;
