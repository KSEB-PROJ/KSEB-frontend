import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import styles from './ChartStyles.module.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface LineChartProps {
  data: { date: string; count: number }[];
  title: string;
}

const LineChart: React.FC<LineChartProps> = ({ data, title }) => {
  // 데이터가 없거나 배열이 아닐 경우 로딩 또는 데이터 없음 메시지 표시
  if (!data || data.length === 0) {
    return <div className={styles.chartContainer}>데이터를 불러오는 중...</div>;
  }

  const chartData = {
    labels: data.map(d => d.date),
    datasets: [
      {
        label: '가입자 수',
        data: data.map(d => d.count),
        borderColor: '#3498db',
        backgroundColor: 'rgba(52, 152, 219, 0.2)',
        fill: true,
        tension: 0.4,
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
        x: {
            grid: {
                display: false,
            }
        }
    }
  };

  return (
    <div className={styles.chartContainer}>
      <Line options={options} data={chartData} />
    </div>
  );
};

export default LineChart;