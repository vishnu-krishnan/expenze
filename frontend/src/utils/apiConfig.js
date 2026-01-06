export const getApiUrl = (endpoint) => {
    // Check if we are in production and have a backend URL configured
    // This allows specific override via env var, otherwise falls back to relative path (proxy)
    const baseUrl = import.meta.env.VITE_API_BASE_URL || '';

    // Ensure we don't have double slashes if the env var ends with /
    const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

    return `${cleanBaseUrl}${cleanEndpoint}`;
};
