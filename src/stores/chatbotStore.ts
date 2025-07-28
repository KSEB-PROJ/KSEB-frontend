import { create } from 'zustand';
import { postChatQuery } from '../api/chatbot';
import { type ChatMessage } from '../types'; // 정확한 타입 경로 지정

interface ChatbotState {
    messages: ChatMessage[];
    isLoading: boolean;
    sendMessage: (query: string, channelId: number) => Promise<void>;
    resetConversation: () => void;
}

const initialState = {
    messages: [
        {
            author: 'ai' as const,
            text: '안녕하세요! KSEB의 AI 비서입니다. 무엇을 도와드릴까요? \n\n예시:\n- "내일 2시에 팀 회의 잡아줘"\n- "어제 오후 회의 내용 요약해줘"',
        },
    ],
    isLoading: false,
};

export const useChatbotStore = create<ChatbotState>((set) => ({
    ...initialState,

    resetConversation: () => {
        set(initialState);
    },

    sendMessage: async (query: string, channelId: number) => {
        const userMessage: ChatMessage = { author: 'user', text: query };
        set((state) => ({
            messages: [...state.messages, userMessage],
            isLoading: true,
        }));

        try {
            const response = await postChatQuery(channelId, { query });
            const aiMessage: ChatMessage = { author: 'ai', text: response.data.answer };
            set((state) => ({
                messages: [...state.messages, aiMessage],
            }));
        } catch (error) {
            console.error('AI 챗봇 요청 실패:', error);
            const errorMessage: ChatMessage = { author: 'ai', text: '죄송합니다. 요청 처리 중 오류가 발생했습니다.' };
            set((state) => ({
                messages: [...state.messages, errorMessage],
            }));
        } finally {
            set({ isLoading: false });
        }
    },
}));