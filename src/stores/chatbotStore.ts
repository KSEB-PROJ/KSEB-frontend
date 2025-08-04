import { create } from 'zustand';
import { postChatQuery } from '../api/chatbot';
import { type ScheduleEvent, type BackendEventResponse } from '../types';
import { useGroupStore } from './groupStore';

// 'any' 타입을 대체할 구체적인 타입 정의
interface Recommendation {
    start: string;
    end: string;
}

interface UpdatedFields {
    title?: string;
    startDatetime?: string;
    endDatetime?: string;
}

export interface ChatMessage {
    author: 'ai' | 'user';
    text: string;
    recommendations?: Recommendation[]; 
    schedules?: BackendEventResponse[];
    groupId?: number;
    createdSchedule?: Partial<ScheduleEvent>;
    updatedSchedule?: { eventId: number; updated_fields: UpdatedFields };
    deletedSchedule?: { eventId: number; title: string };
}

interface ChatbotState {
    messages: ChatMessage[];
    isLoading: boolean;
    error: string | null;
    sendMessage: (text: string, channelId: number) => Promise<void>;
    resetConversation: () => void;
}

const initialState = {
    messages: [
        {
            author: 'ai' as const,
            text: '안녕하세요! KSEB의 AI 비서입니다. 무엇을 도와드릴까요? \n\n예시:\n- "내일 2시에 팀 회의 잡아줘"\n- "어제 오후 회의 내용 요약해줘"\n- "다음 주 회의 시간 추천해줘"',
        },
    ],
    isLoading: false,
    error: null,
};

export const useChatbotStore = create<ChatbotState>((set) => ({
    ...initialState,

    resetConversation: () => {
        set(initialState);
    },

    sendMessage: async (query: string, channelId: number) => {
        const selectedGroup = useGroupStore.getState().selectedGroup;
        if (!selectedGroup) {
            const errorMessage: ChatMessage = { author: 'ai', text: '오류: 현재 선택된 그룹이 없습니다. 먼저 그룹을 선택해주세요.' };
            set(state => ({ messages: [...state.messages, errorMessage] }));
            return;
        }
        const groupId = selectedGroup.id;

        const userMessage: ChatMessage = { author: 'user', text: query };
        set((state) => ({
            messages: [...state.messages, userMessage],
            isLoading: true,
        }));

        try {
            const response = await postChatQuery(groupId, channelId, { query });
            const answer = response.data.answer;
            const aiMessage: ChatMessage = { author: 'ai', text: answer };

            try {
                const toolResult = JSON.parse(answer);
                
                switch (toolResult.tool) {
                    case 'recommend_meeting_time':
                        aiMessage.recommendations = toolResult.data.recommendations;
                        aiMessage.groupId = toolResult.data.group_id;
                        aiMessage.text = "";
                        break;
                    case 'get_schedule':
                        aiMessage.schedules = toolResult.data;
                        aiMessage.text = "요청하신 일정을 찾았어요.";
                        break;
                    case 'create_schedule':
                        aiMessage.createdSchedule = toolResult.data.created_event_details;
                        aiMessage.text = toolResult.data.message;
                        break;
                    case 'update_schedule':
                        aiMessage.updatedSchedule = toolResult.data.updated_event_details;
                        aiMessage.text = toolResult.data.message;
                        break;
                    case 'delete_schedule':
                        aiMessage.deletedSchedule = toolResult.data.deleted_event_details;
                        aiMessage.text = toolResult.data.message;
                        break;
                    default:
                        aiMessage.text = toolResult.data?.message || answer;
                }
            } catch {
                // JSON 파싱 실패 시 일반 텍스트로 처리
            }
            
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
