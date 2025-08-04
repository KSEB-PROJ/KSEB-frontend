// 챗봇 메시지를 파싱하여 일반 텍스트 또는 커스텀 UI로 렌더링하는 컴포넌트.
import React from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { ChatMessage as Message } from '../../stores/chatbotStore';
import ScheduleList from './ScheduleList';
import MeetingRecommendation from './MeetingRecommendation';
import ScheduleCreationSuccess from './ScheduleCreationSuccess';
import ScheduleUpdateSuccess from './ScheduleUpdateSuccess';
import ScheduleDeleteSuccess from './ScheduleDeleteSuccess';
import styles from '../ChatbotSidebar/ChatbotSidebar.module.css'; // 사이드바 스타일 재사용

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const renderSpecialContent = () => {
    if (message.recommendations?.length) {
      return <MeetingRecommendation recommendations={message.recommendations} />;
    }
    if (message.schedules?.length) {
      return <ScheduleList data={message.schedules} />;
    }
    if (message.createdSchedule) {
      return <ScheduleCreationSuccess schedule={message.createdSchedule} />;
    }
    if (message.updatedSchedule) {
      return <ScheduleUpdateSuccess data={message.updatedSchedule} />;
    }
    if (message.deletedSchedule) {
      return <ScheduleDeleteSuccess data={message.deletedSchedule} />;
    }
    return null;
  };

  const specialContent = renderSpecialContent();

  return (
    <div className={styles.bubble}>
      <Markdown remarkPlugins={[remarkGfm]} components={{
          a: ({...props}) => <a className={styles.markdownLink} {...props} />,
          table: ({...props}) => <table className={styles.markdownTable} {...props} />,
          thead: ({...props}) => <thead className={styles.markdownThead} {...props} />,
          tr: ({...props}) => <tr className={styles.markdownTr} {...props} />,
          th: ({...props}) => <th className={styles.markdownTh} {...props} />,
          td: ({...props}) => <td className={styles.markdownTd} {...props} />,
      }}>{message.text}</Markdown>

      {specialContent}
    </div>
  );
};

export default ChatMessage;
