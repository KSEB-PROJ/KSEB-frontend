import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import styles from './ChartStyles.module.css';

ChartJS.register(ArcElement, Tooltip, Legend);

interface DoughnutChartProps {
  data: {
    groupCount: number;
    channelCount: number;
    noticeCount: number;
    eventCount: number;
  } | null;
  title: string;
}

const DoughnutChart: React.FC<DoughnutChartProps> = ({ data, title }) => {
    if (!data) {
        return <div className={styles.chartContainer}>Loading...</div>;
    }

  const chartData = {
    labels: ['그룹', '채널', '공지', '일정'],
    datasets: [
      {
        label: '콘텐츠 비율',
        data: [data.groupCount, data.channelCount, data.noticeCount, data.eventCount],
        backgroundColor: [
          '#e74c3c',
          '#3498db',
          '#f1c40f',
          '#2ecc71',
        ],
        hoverOffset: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
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
  };

  return (
    <div className={styles.chartContainer}>
      <Doughnut data={chartData} options={options} />
    </div>
  );
};

export default DoughnutChart;
