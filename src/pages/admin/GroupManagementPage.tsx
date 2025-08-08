import React, { useEffect, useState } from 'react';
import { useAdminStore } from '../../stores/adminStore';
import styles from './GroupManagementPage.module.css';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const GroupManagementPage: React.FC = () => {
    const { 
        groups, groupPagination, isLoading, error, fetchGroups, deleteGroupAction,
        selectedGroupDetails, isLoadingDetails, fetchGroupDetails, clearGroupDetails
    } = useAdminStore();
    const [currentPage, setCurrentPage] = useState(0);
    const [collapsedSections, setCollapsedSections] = useState({
        channels: false,
        notices: false,
        members: false,
    });
    const pageSize = 10;

    useEffect(() => {
        fetchGroups(currentPage, pageSize);
    }, [currentPage, fetchGroups]);

    const handlePageChange = (newPage: number) => {
        if (newPage >= 0 && newPage < (groupPagination?.totalPages ?? 0)) {
            setCurrentPage(newPage);
        }
    };

    const handleDeleteGroup = (e: React.MouseEvent, groupId: number) => {
        e.stopPropagation();
        if (window.confirm(`정말로 이 그룹을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) {
            deleteGroupAction(groupId);
            if (selectedGroupDetails?.id === groupId) {
                clearGroupDetails();
            }
        }
    };

    const handleRowClick = (groupId: number) => {
        fetchGroupDetails(groupId);
        setCollapsedSections({ channels: false, notices: false, members: false }); // 모달 열 때 초기화
    };

    const toggleSection = (section: keyof typeof collapsedSections) => {
        setCollapsedSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const renderDetailModal = () => {
        if (!selectedGroupDetails) return null;

        return (
            <div className={styles.modalOverlay} onClick={clearGroupDetails}>
                <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                    <button className={styles.closeButton} onClick={clearGroupDetails}>X</button>
                    {isLoadingDetails ? (
                        <div>상세 정보 로딩 중...</div>
                    ) : (
                        <>
                            <h2 className={styles.modalTitle}>그룹 상세 정보: {selectedGroupDetails.name}</h2>
                            <div className={styles.detailGrid}>
                                <p><strong>ID:</strong> {selectedGroupDetails.id}</p>
                                <p><strong>그룹명:</strong> {selectedGroupDetails.name}</p>
                                <p><strong>생성자:</strong> {selectedGroupDetails.ownerName}</p>
                                <p><strong>생성일:</strong> {new Date(selectedGroupDetails.createdAt).toLocaleString()}</p>
                                <p><strong>멤버 수:</strong> {selectedGroupDetails.memberCount}</p>
                            </div>

                            <div className={styles.sectionHeader} onClick={() => toggleSection('channels')}>
                                <h3 className={styles.sectionTitle}>채널 목록 ({selectedGroupDetails.channels.length})</h3>
                                <span className={styles.toggleIcon}>{collapsedSections.channels ? '+' : '-'}</span>
                            </div>
                            {!collapsedSections.channels && (
                                <ul className={styles.list}>
                                    {selectedGroupDetails.channels.map(channel => (
                                        <li key={channel.id}><strong>{channel.name}</strong> ({channel.type})</li>
                                    ))}
                                </ul>
                            )}

                            <div className={styles.sectionHeader} onClick={() => toggleSection('notices')}>
                                <h3 className={styles.sectionTitle}>공지사항 ({selectedGroupDetails.notices.length})</h3>
                                <span className={styles.toggleIcon}>{collapsedSections.notices ? '+' : '-'}</span>
                            </div>
                            {!collapsedSections.notices && (
                                <div className={styles.markdownContent}>
                                    {selectedGroupDetails.notices.map(notice => (
                                        <div key={notice.id} className={styles.noticeItem}>
                                            <div className={styles.noticeHeader}>
                                                <strong>{notice.authorName}</strong>
                                                <span>({new Date(notice.createdAt).toLocaleString()})</span>
                                            </div>
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                {notice.content}
                                            </ReactMarkdown>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className={styles.sectionHeader} onClick={() => toggleSection('members')}>
                                <h3 className={styles.sectionTitle}>멤버 목록 ({selectedGroupDetails.members.length})</h3>
                                <span className={styles.toggleIcon}>{collapsedSections.members ? '+' : '-'}</span>
                            </div>
                            {!collapsedSections.members && (
                                <ul className={styles.list}>
                                    {selectedGroupDetails.members.map(member => (
                                        <li key={member.userId}>
                                            <strong>{member.userName}</strong> (역할: {member.role}, 참여일: {new Date(member.joinedAt).toLocaleString()})
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>그룹 관리</h1>
            {isLoading && !groups.length && <div>Loading...</div>}
            {error && <div className={styles.error}>{error}</div>}
            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>그룹명</th>
                            <th>생성자</th>
                            <th>멤버 수</th>
                            <th>생성일</th>
                            <th>관리</th>
                        </tr>
                    </thead>
                    <tbody>
                        {groups.map((group) => (
                            <tr key={group.id} onClick={() => handleRowClick(group.id)} className={styles.clickableRow}>
                                <td>{group.id}</td>
                                <td>{group.name}</td>
                                <td>{group.createdBy}</td>
                                <td>{group.memberCount}</td>
                                <td>{new Date(group.createdAt).toLocaleDateString()}</td>
                                <td>
                                    <button
                                        onClick={(e) => handleDeleteGroup(e, group.id)}
                                        className={`${styles.actionButton} ${styles.deleteButton}`}
                                    >
                                        삭제
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className={styles.pagination}>
                <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 0}>
                    이전
                </button>
                <span>
                    페이지 {currentPage + 1} / {groupPagination?.totalPages ?? 1}
                </span>
                <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage >= (groupPagination?.totalPages ?? 1) - 1}>
                    다음
                </button>
            </div>
            {renderDetailModal()}
        </div>
    );
};

export default GroupManagementPage;
