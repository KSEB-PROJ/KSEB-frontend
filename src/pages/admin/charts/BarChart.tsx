import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import styles from './ChartStyles.module.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface BarChartProps {
  data: { hour: number; count: number }[];
  title: string;
}

const BarChart: React.FC<BarChartProps> = ({ data, title }) => {
  // 데이터가 없거나 배열이 아닐 경우 로딩 또는 데이터 없음 메시지 표시
  if (!data || data.length === 0) {
    return (
      <div className={styles.chartContainer}>
        <div className={styles.emptyDataMessage}>
          최근 24시간 활동 기록이 없습니다.
        </div>
      </div>
    );
  }

  const chartData = {
    labels: data.map(d => `${d.hour}시`),
    datasets: [
      {
        label: '활동량',
        data: data.map(d => d.count),
        backgroundColor: '#2ecc71',
        borderRadius: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: title,
        font: {
          size: 16,
          family: 'inherit',
        },
        padding: {
            bottom: 20,
        }
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
      x: {
        grid: {
            display: false,
        }
      }
    },
  };

  return (
    <div className={styles.chartContainer}>
      <Bar options={options} data={chartData} />
    </div>
  );
};

export default BarChart;