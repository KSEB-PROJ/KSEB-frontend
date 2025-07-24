import React, { useRef, useState } from 'react';
import { Chart as ChartJS,  CategoryScale,  LinearScale,  BarElement,  Title,  Tooltip,  Legend} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import styles from './FeedbackPage.module.css';
import dayjs from 'dayjs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {faUpload, faPlay} from '@fortawesome/free-solid-svg-icons';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const FeedbackPage: React.FC = () => {
    const inputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const [video, setVideo] = useState<File | null>(null);
    const [uploadTime, setUploadTime] = useState<Date | null>(null);
    const [videoURL, setVideoURL] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const options = {
        indexAxis: 'y' as const,  // 가로 바 차트 모드 설정
        responsive: true,         // 반응형 지원
        plugins: {
            title: {
            display: true,
            text: 'AI 피드백 항목 평가',  // 타이틀 텍스트
            },
        },
        };
    const labels = ['표정', '동작', '말투'];  // 3개의 항목
    const data = {
        labels,
        datasets: [
            {
            data: [75, 60, 85], borderRadius: 4, barThickness: 20,                   
            },
        ],
        };
    const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setVideo(file);
            setUploadTime(new Date());
            const url = URL.createObjectURL(file); //브라우저 내 비디오 재생
            setVideoURL(url);
            setIsPlaying(false);
        }
    };
    //업로드 클릭시 input 열기
    const handleVideoClick = () => {
        if (!video) {
            inputRef.current?.click();
        }
    };
    //재생버튼 클릭 시 재생
    const handlePlayClick = () => {
        if (videoRef.current) {
            videoRef.current.play();
            setIsPlaying(true);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.top}>
                <h1 className={styles.title}>AI 발표 피드백</h1>
                <p className={styles.description}>발표 영상을 업로드하고 AI의 피드백을 받아보세요.</p>
            </div>
            <div className={styles.field}>
                <div className={styles.videofield}>
                    {/* 파일 업로드 시만 시간 보임 */}
                    {uploadTime && (
                        <span className={styles.timestamp}>
                            {dayjs(uploadTime).format('YYYY-MM-DD HH:mm')}
                        </span>
                    )}
                    {/* 영상 업로드 영역 */}
                    <div className={styles.videoupload} onClick={handleVideoClick}>
                        {/* 업로드 전 */}
                        {!video ? (
                            <>
                                <FontAwesomeIcon icon={faUpload} className={styles.uploadIcon}/>
                            </>
                        ) : (
                            // 업로드 후
                            <div className={styles.thumbnailWrapper}>
                                <video 
                                    ref={videoRef} 
                                    className={styles.thumbnail} 
                                    src={videoURL ?? undefined} 
                                    controls={isPlaying} //재생 중일 때만 영상바 보이게
                                    poster=""
                                />
                                {/* 재생 안했으면 재생 버튼 가운데 */}
                                {!isPlaying && (
                                    <button className={styles.playButton} onClick={handlePlayClick}>
                                        <FontAwesomeIcon icon={faPlay} className={styles.playIcon} />
                                    </button>
                                )}
                            </div>
                        )}
                        <input 
                            ref={inputRef}
                            type="file"
                            accept="video/*"
                            onChange={handleVideoUpload}
                            style={{ display: 'none' }}
                        />
                    </div>
                    {/* 평가 영역 - 표정, 동작, 말투 */}
                    <div className={styles.chart}>
                        <Bar options={options} data={data} />
                    </div>
                </div>
                {/* 지피티 피드백 영역 */}
                <div className={styles.feedbackfield}>
                    피드백 내용
                </div>
            </div>
        </div>
    );
};

export default FeedbackPage;
