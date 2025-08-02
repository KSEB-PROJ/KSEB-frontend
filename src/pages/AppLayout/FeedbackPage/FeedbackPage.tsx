import React, { useRef, useState, useEffect } from 'react';
import { Chart as ChartJS,  CategoryScale,  LinearScale,  BarElement,  Tooltip } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import styles from './FeedbackPage.module.css';
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import dayjs from 'dayjs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {faUpload, faPlay, faRobot, faAngleRight, faPersonCirclePlus,faO} from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

const FeedbackPage: React.FC = () => {
    const inputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const [video, setVideo] = useState<File | null>(null);
    const [uploadTime, setUploadTime] = useState<Date | null>(null);
    const [videoURL, setVideoURL] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const scores = [10, 60, 85];
    const [chartColor, setChartColor] = useState('rgb(132, 0, 255)');
    const feedbackText = " # 이번 발표의 총점은 76점입니다. \n 먼저, 발표 내용을 체계적으로 잘 구성하여 청중이 내용을 따라가기 쉬웠으며, 각 주요 포인트가 명확하게 전달되어 이해도를 높였습니다. 특히 서론에서 주제를 분명히 제시하고, 중간에 관련 사례와 데이터를 적절히 활용해 신뢰성을 더한 점이 좋았습니다.\n 발표자의 **표정**은 대체로 자연스러웠으나, 중간중간 긴장한 듯한 모습이 보였습니다. 앞으로는 더 자신감을 표현할 수 있도록 미소를 자주 짓고, 시선을 청중과 자주 맞추는 연습이 필요하겠습니다.\n 또한 **동작** 면에서는 손짓이 다소 제한적이었는데, 중요한 내용을 강조할 때 자연스러운 제스처를 추가하면 메시지가 더욱 효과적으로 전달될 것입니다.\n **말투**는 대체로 명확하고 또박또박했지만, 몇몇 부분에서 말하는 속도가 빨라져 청중이 따라가기 어려웠던 점이 있었습니다. 적절한 속도 조절과 중간중간 пауз(멈춤)를 넣어 청중이 내용을 소화할 시간을 줄 필요가 있습니다. 또한 단조로움을 줄이기 위해 높낮이 변화와 감정 전달에도 신경 써보면 좋겠습니다.\n 마지막으로, **기술적인 면**에서는 발표 자료의 시각 요소(슬라이드 디자인, 글자 크기, 색상 대비 등)가 전체적으로 깔끔했으나, 일부 그래프와 텍스트가 조밀하게 배치되어 가독성이 떨어진 부분이 있었습니다. 쉬운 이해를 돕기 위해 핵심 내용 중심으로 간결하게 수정하면 발표 효과가 더욱 증가할 것입니다.\n 종합하면, 발표자의 노력과 전문성이 돋보이는 발표였으며, 비언어적 표현과 속도 조절에 조금 더 신경 쓴다면 훨씬 자연스럽고 설득력 있는 발표가 될 것으로 기대됩니다. 계속해서 연습과 피드백을 통해 개선해나가시길 바랍니다.";
    const[lastfeedbacks, setLastFeedbacks] = useState<{ id: number; timestamp:string; uploadTime:string} []>([]);
    const navigate = useNavigate();

    useEffect(() => {
        requestAnimationFrame(()=> {
            const rootStyles = getComputedStyle(document.documentElement);
            const groupRGB = rootStyles.getPropertyValue('--group-color').trim();
            if (groupRGB) {
                setChartColor(`rgb(${groupRGB})`);
            }
        });
    }, []);

    const options = {
        indexAxis: 'y' as const,  // 가로 바 차트 모드 설정
        responsive: true,         // 반응형 지원
        plugins: {
            title: {
            display: true,
            text: 'AI 피드백 항목 평가',  // 타이틀 텍스트
            color: chartColor
            },
        },
        scales:{
            y: {
                ticks:{
                    color:chartColor
                }
            },
            x: {
                ticks:{
                    color:chartColor
                }
            }
        }
        };
    const labels = ['표정', '동작', '말투'];  // 3개의 항목
    const data = {
        labels,
        datasets: [
            {
            data: scores, borderRadius: 4, barThickness: 20,
            backgroundColor: '#CCC',
            },
        ],
    };
    const handleAddFeedback = () => {
        setVideo(null);
        setVideoURL(null);
        setUploadTime(null);
        setIsPlaying(false);
    };
    const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setVideo(file);
            const now = new Date(); 
            setUploadTime(now);
            const url = URL.createObjectURL(file); //브라우저 내 비디오 재생
            setVideoURL(url);
            setIsPlaying(false);
            setLastFeedbacks ((prev) => {
                if (prev.length >= 30) return prev;
                return [
                    ...prev,
                    {
                        id: prev.length + 1,
                        timestamp: now.toLocaleString(),
                        uploadTime: dayjs(now).format('YYYY-MM-DD HH:mm'),
                    },
                    ]}); } };
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
                <div className={styles.pwrapper}>
                    <FontAwesomeIcon icon={faPersonCirclePlus} className={styles.plus} onClick={handleAddFeedback}/>
                    <p className={styles.pdescription}> [ 발표 영상 업로드 다시 해보기! ] </p>
                </div>
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
                    <FontAwesomeIcon icon={faRobot} className={styles.playIcon} />
                    <div className={styles.feedback}>
                        {feedbackText && (<ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>{feedbackText}</ReactMarkdown>)}
                    </div>
                </div>
            </div>
            <div className={styles.bottom}>
                <div className={styles.line}>
                        {lastfeedbacks.map((f, idx) => {
                            const count = lastfeedbacks.length;
                            const leftPercent = count <= 10 ? (idx / 9) * 100 : (idx / (count - 1)) * 100;
                             return (
                                <div
                                    key={f.id}
                                    className={styles.dot}
                                    style={{ left: `${leftPercent}%` }}
                                    onClick={() => navigate(`/feedback/${f.id}`)} >
                                    <FontAwesomeIcon icon={faO} />
                                    <div className={styles.tooltip}>{f.uploadTime}</div>
                                </div>
                            );
                        })}
                        <FontAwesomeIcon icon={faAngleRight} className={styles.arrowIcon} />
                    </div>
            </div>
        </div>
    );
};

export default FeedbackPage;