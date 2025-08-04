import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import toast from 'react-hot-toast';

import type { ChatMessageResponse } from '../types';
import { getMessages, sendMessage as sendMessageApi, updateMessage as updateMessageApi, deleteMessage as deleteMessageApi } from '../api/chat';

// WebSocket을 통해 수신되는 메시지 타입 정의
type WebSocketPayload = ChatMessageResponse | ChatMessageResponse[] | { id: number };

interface WebSocketEvent {
    type: 'NEW_MESSAGE' | 'NEW_MESSAGES' | 'MESSAGE_UPDATE' | 'MESSAGE_DELETE';
    payload: WebSocketPayload;
}

interface ChatState {
    messages: ChatMessageResponse[];
    stompClient: Client | null;
    isLoading: boolean;
    channelId: number | null;
    connectAndSubscribe: (channelId: number, token: string) => void;
    disconnect: () => void;
    sendMessage: (content: string, files?: File[]) => void;
    updateMessage: (messageId: number, content: string) => Promise<void>;
    deleteMessage: (messageId: number) => Promise<void>;
    addMessage: (message: ChatMessageResponse | ChatMessageResponse[]) => void;
    updateLocalMessage: (message: ChatMessageResponse) => void;
    removeLocalMessage: (messageId: number) => void;
    reset: () => void;
}

export const useChatStore = create<ChatState>()(
    devtools(
        (set, get) => ({
            messages: [],
            stompClient: null,
            isLoading: false,
            channelId: null,

            connectAndSubscribe: async (channelId, token) => {
                if (get().stompClient && get().channelId === channelId) return;
                if (get().stompClient) get().disconnect();

                set({ isLoading: true, channelId, messages: [] });

                try {
                    const response = await getMessages(channelId);
                    set({ messages: response.data });
                } catch {
                    toast.error('이전 메시지를 불러오는데 실패했습니다.');
                } finally {
                    set({ isLoading: false });
                }

                const client = new Client({
                    webSocketFactory: () => new SockJS(`${import.meta.env.VITE_API_BASE_URL}/ws`),
                    connectHeaders: { Authorization: `Bearer ${token}` },
                    onConnect: () => {
                        client.subscribe(`/topic/channels/${channelId}`, message => {
                            const event = JSON.parse(message.body) as WebSocketEvent;
                            switch (event.type) {
                                case 'NEW_MESSAGE':
                                    get().addMessage(event.payload as ChatMessageResponse);
                                    break;
                                case 'NEW_MESSAGES':
                                    get().addMessage(event.payload as ChatMessageResponse[]);
                                    break;
                                case 'MESSAGE_UPDATE':
                                    get().updateLocalMessage(event.payload as ChatMessageResponse);
                                    break;
                                case 'MESSAGE_DELETE':
                                    get().removeLocalMessage((event.payload as { id: number }).id);
                                    break;
                            }
                        });
                    },
                    onStompError: () => {
                        toast.error('실시간 채팅 연결에 오류가 발생했습니다.');
                    },
                });

                client.activate();
                set({ stompClient: client });
            },

            disconnect: () => {
                get().stompClient?.deactivate();
                get().reset();
            },

            sendMessage: async (content, files) => {
                const { channelId } = get();
                if (!channelId) return;
                try {
                    await sendMessageApi(channelId, { content, files });
                } catch {
                    toast.error('메시지 전송에 실패했습니다.');
                }
            },

            updateMessage: async (messageId, content) => {
                const { channelId } = get();
                if (!channelId) return;
                try {
                    await updateMessageApi(channelId, messageId, content);
                } catch {
                    toast.error('메시지 수정에 실패했습니다.');
                }
            },

            deleteMessage: async (messageId) => {
                const { channelId } = get();
                if (!channelId) return;
                try {
                    await deleteMessageApi(channelId, messageId);
                } catch {
                    toast.error('메시지 삭제에 실패했습니다.');
                }
            },

            addMessage: (newMessages) => {
                set(state => {
                    const messagesToAdd = Array.isArray(newMessages) ? newMessages : [newMessages];
                    
                    // [수정] ID가 없는 비정상적인 메시지 데이터는 필터링하여 오류 방지
                    const validMessages = messagesToAdd.filter(m => m && typeof m.id === 'number');
                    if (validMessages.length !== messagesToAdd.length) {
                        console.error("Warning: Some messages received via WebSocket were invalid and ignored.", newMessages);
                    }

                    if (validMessages.length === 0) return state;

                    const existingIds = new Set(state.messages.map(m => m.id));
                    const uniqueNewMessages = validMessages.filter(m => !existingIds.has(m.id));
                    
                    if (uniqueNewMessages.length === 0) return state;

                    return { messages: [...state.messages, ...uniqueNewMessages] };
                });
            },

            updateLocalMessage: (updatedMessage) => {
                set(state => ({
                    messages: state.messages.map(msg =>
                        msg.id === updatedMessage.id ? updatedMessage : msg
                    ),
                }));
            },

            removeLocalMessage: (messageId) => {
                set(state => ({
                    messages: state.messages.map(msg =>
                        msg.id === messageId
                            ? { ...msg, content: '삭제된 메시지입니다.', deleted: true, fileUrl: undefined, fileName: undefined, messageType: 'TEXT' }
                            : msg
                    ),
                }));
            },

            reset: () => {
                set({
                    messages: [],
                    stompClient: null,
                    isLoading: false,
                    channelId: null,
                });
            },
        }),
        { name: 'ChatStore' }
    )
);
