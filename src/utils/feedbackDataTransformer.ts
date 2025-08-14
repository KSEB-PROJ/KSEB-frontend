/**
 * @file feedbackDataTransformer.ts
 * @description AI 서버의 실제 분석 결과 원본 데이터를 프론트엔드 UI(Recharts)에 맞는 형태로 변환하는 함수 모음.
 */

// 서버에서 오는 원본 데이터 타입 (사용자가 제공한 JSON 기반)
export interface ServerData {
  video: {
    id: number;
    title: string;
    video_url: string;
    upload_time: string;
  };
  score: {
    pose_score?: number;
    gaze_score?: number;
    pitch_score?: number;
    speed_score?: number;
    pronunciation_score?: number;
    emotion_score?: number; // 종합 점수 계산에서 제외
  };
  feedback: {
    short_feedback: string;
    detail_feedback: string;
    final_report?: string; // AI 서버가 생성할 최종 리포트
  };
  emotion_avg: { [key: string]: number };
  audios: Array<{ 
    speed: Array<{ stn_start: number; wpm: number; wpm_band: 'good' | 'bad' }>;
    pitch: Array<{ time: number; hz: number | null }>;
  }>;
  poses: Array<{ image_type: string }>;
}

// 프론트엔드 UI에서 사용하는 새로운 데이터 타입
export interface FrontendData {
  title: string; // [추가] 영상 제목 속성
  videoUrl: string;
  detailFeedback: string;
  finalReport: string;
  overallScore: number;
  scores: {
    pose: number;
    gaze: number;
    pitch: number;
    speed: number;
    pronunciation: number;
  };
  emotionChartData: { name: string; value: number }[];
  speedTimelineData: { time: string; wpm: number }[];
  pitchTimelineData: { time: string; hz: number }[];
  poseFrequencyData: { name: string; count: number }[];
  confidenceRadarData: { subject: string; score: number; fullMark: number }[];
}

/**
 * 서버의 원본 분석 데이터를 프론트엔드 UI에 맞게 변환.
 * @param serverData - AI 서버로부터 받은 원본 데이터.
 * @returns {FrontendData} - Recharts 그래프 등에 사용될 수 있는 형태로 가공된 데이터.
 */
export const transformAnalysisData = (serverData: ServerData): FrontendData => {
  const { video, score, feedback, emotion_avg, audios, poses } = serverData;

  // 1. 종합 점수 계산 (emotion_score 제외)
  const validScores = [
    score.pose_score,
    score.gaze_score,
    score.pitch_score,
    score.speed_score,
    score.pronunciation_score,
  ].filter(s => typeof s === 'number') as number[];
  
  const overallScore = validScores.length > 0 
    ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length)
    : 0;

  // 2. 감정 분석 데이터 (Pie Chart)
  const emotionChartData = Object.entries(emotion_avg).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1), // 'angry' -> 'Angry'
    value: parseFloat(value.toFixed(2)),
  }));

  // 3. 시간대별 말 빠르기 데이터 (Line Chart)
  const speedTimelineData = audios[0]?.speed.map(s => ({
    time: `${Math.round(s.stn_start)}s`,
    wpm: Math.round(s.wpm),
  })) || [];

  // 4. 시간대별 음높이 데이터 (Line Chart)
  const pitchTimelineData = audios[0]?.pitch
    .filter(p => p.hz !== null) // hz가 null이 아닌 데이터만 사용
    .map(p => ({
      time: `${p.time.toFixed(1)}s`,
      hz: Math.round(p.hz!),
    })) || [];

  // 5. 자세 분석 데이터 (Bar Chart)
  const poseCounts = poses.reduce((acc, p) => {
    const type = p.image_type || 'UNKNOWN';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as { [key: string]: number });

  const poseFrequencyData = Object.entries(poseCounts).map(([name, count]) => ({
    name,
    count,
  }));

  // 6. 자신감 분석 데이터 (Radar Chart)
  const confidenceRadarData = [
    { subject: '자세', score: Math.round(score.pose_score || 0), fullMark: 100 },
    { subject: '시선', score: Math.round(score.gaze_score || 0), fullMark: 100 },
    { subject: '발음', score: Math.round(score.pronunciation_score || 0), fullMark: 100 },
    { subject: '속도', score: Math.round(score.speed_score || 0), fullMark: 100 },
    { subject: '음높이', score: Math.round(score.pitch_score || 0), fullMark: 100 },
  ];
  
  // 7. 피드백 텍스트 클리닝
  const cleanedFeedback = feedback.detail_feedback
    .replace(/(\d+\.\d)(\d+\.\d)초/g, '$1초 ~ $2초') // 시간 형식 오류 수정
    .replace(/\n---\n/g, '\n\n'); // 불필요한 가로선 제거

  return {
    title: video.title, // [추가] video.title을 매핑
    videoUrl: video.video_url,
    detailFeedback: cleanedFeedback,
    finalReport: feedback.final_report || "", // 서버에서 오는 리포트 사용
    overallScore,
    scores: {
      pose: Math.round(score.pose_score || 0),
      gaze: Math.round(score.gaze_score || 0),
      pitch: Math.round(score.pitch_score || 0),
      speed: Math.round(score.speed_score || 0),
      pronunciation: Math.round(score.pronunciation_score || 0),
    },
    emotionChartData,
    speedTimelineData,
    pitchTimelineData,
    poseFrequencyData,
    confidenceRadarData,
  };
};
