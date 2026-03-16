import axios from 'axios';

const api = axios.create({
    baseURL: 'https://api.odpay.in',
});

// Request interceptor to add the auth token header to every request
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
        if (token) {
            // Send in both headers for compatibility with staging/production APIs
            // Removing Bearer prefix as it caused 401 errors in live
            config.headers['Authorization'] = token;
            config.headers['token'] = token;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;
