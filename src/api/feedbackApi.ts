/**
 * @file feedbackApi.ts
 * @description AI 서버 (KSEB-AI)와 통신하여 피드백 데이터를 가져오는 API 함수 모음.
 */
import axios from 'axios';
import { useAuthStore } from '../stores/authStore'; // authStore 임포트
import type { ServerData } from '../utils/feedbackDataTransformer'; // ServerData 타입을 가져옵니다.

// AI 서버의 기본 URL. 환경 변수에서 가져오며, 없을 경우 로컬 기본값을 사용.
const AI_API_BASE_URL = import.meta.env.VITE_AI_API_URL || 'http://localhost:8000';

// Axios 인스턴스 생성
const aiApiClient = axios.create({
  baseURL: AI_API_BASE_URL,
});

// --- Axios 요청 인터셉터 ---
// API 요청을 보내기 전에 헤더에 JWT 토큰을 자동으로 추가.
aiApiClient.interceptors.request.use(
  (config) => {
    // Zustand 스토어에서 토큰을 가져옴.
    const token = useAuthStore.getState().token;
    if (token) {
      // 토큰이 있으면 Authorization 헤더에 추가.
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);


/**
 * 비디오와 대본 파일을 AI 서버에 업로드하고 분석을 '시작'시키는 함수.
 * @param videoFile - 사용자가 업로드한 비디오 파일.
 * @param title - 발표 제목.
 * @param scriptFile - 사용자가 업로드한 .txt 대본 파일.
 * @returns {Promise<{ video_id: number }>} - 분석이 시작된 비디오의 고유 ID.
 */
export const startVideoAnalysis = async (videoFile: File, title: string, scriptFile: File): Promise<{ video_id: number }> => {
  const formData = new FormData();
  
  formData.append('file', videoFile);
  formData.append('script', scriptFile);
  formData.append('title', title);

  try {
    // 인터셉터가 헤더를 자동으로 추가해주므로, 여기서는 헤더를 명시할 필요 없음.
    const response = await aiApiClient.post('/videos/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 600000, // 10분
    });
    return response.data;
  } catch (error) {
    console.error("AI 서버 영상 분석 '시작' 요청 실패:", error);
    throw error;
  }
};

/**
 * 특정 분석 기록(ID)에 대한 데이터를 AI 서버에 요청하는 함수.
 * @param videoId - 조회하려는 분석 기록의 비디오 ID.
 * @returns {Promise<ServerData>} - AI 서버로부터 받은 분석 결과 데이터.
 */
export const getAnalysisResultById = async (videoId: number): Promise<ServerData> => {
  try {
    // 인터셉터가 헤더를 자동으로 추가.
    const response = await aiApiClient.get(`/videos/${videoId}/analysis`);
    return response.data;
  } catch (error) {
    console.error(`ID(${videoId})에 해당하는 분석 기록 조회 실패:`, error);
    throw error;
  }
};

/**
 * 현재 로그인된 사용자의 모든 분석 기록 ID 목록을 가져오는 함수.
 * @returns {Promise<{ video_ids: number[] }>} - 비디오 ID 목록을 포함하는 객체.
 */
export const getMyAnalysisIds = async (): Promise<{ video_ids: number[] }> => {
    try {
      const response = await aiApiClient.get('/videos/my/ids');
      return response.data;
    } catch (error) {
      console.error("내 분석 기록 ID 목록 조회 실패:", error);
      throw error;
    }
  };
