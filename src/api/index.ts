import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    withCredentials: true, // 토큰 방식에서는 보통 false로 두지만, 혹시 모를 쿠키 사용을 위해 유지
});

// Axios 요청 인터셉터
apiClient.interceptors.request.use(
    (config) => {
        // Zustand 스토어에서 토큰을 가져옵니다.
        const { token } = useAuthStore.getState();
        if (token) {
            // 토큰이 있으면 Authorization 헤더에 'Bearer' 형식으로 추가합니다.
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default apiClient;