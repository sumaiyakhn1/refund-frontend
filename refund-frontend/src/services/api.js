import axios from 'axios';

const api = axios.create({
    baseURL: 'https://api.odpay.in',
});

// Request interceptor to add the auth token header to every request
api.interceptors.request.use(
    (config) => {
        const token = sessionStorage.getItem('authToken');
        if (token) {
            config.headers['Authorization'] = token;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;
