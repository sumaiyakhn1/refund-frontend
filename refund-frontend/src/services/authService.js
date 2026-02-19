import axios from 'axios';

const API_URL = 'https://api.odpay.in';

export const portalLogin = async () => {
    try {
        const response = await axios.post(`${API_URL}/login`, {
            mobile: '3434343434',
            password: 'rksdlogin',
        });

        if (response.data && response.data.token) {
            sessionStorage.setItem('authToken', response.data.token);
            console.log('Silent login successful. Token stored.');
            return response.data.token;
        } else {
            console.error('Silent login failed: No token received', response.data);
            return null;
        }
    } catch (error) {
        console.error('Silent login error:', error);
        return null;
    }
};
