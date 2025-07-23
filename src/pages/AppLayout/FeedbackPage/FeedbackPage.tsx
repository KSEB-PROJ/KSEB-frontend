import React, { useRef, useState } from 'react';
import styles from './FeedbackPage.module.css';
import dayjs from 'dayjs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {faUpload, faPlay} from '@fortawesome/free-solid-svg-icons';

const FeedbackPage: React.FC = () => {
    const inputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const [video, setVideo] = useState<File | null>(null);
    const [uploadTime, setUploadTime] = useState<Date | null>(null);
    const [videoURL, setVideoURL] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
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
                            <FontAwesomeIcon icon={faUpload} className={styles.uploadicon}/>
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
                                    <FontAwesomeIcon icon={faPlay} className={styles.playicon} />
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
            </div>
        </div>
    );
};

export default FeedbackPage;
