'use client';

import { Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale, BarElement,
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const COLORS = [
  '#7B2FFF', '#00CFFF', '#FF3B7F', '#FFB830',
  '#10D48E', '#FF4D4D', '#A855F7', '#F97316',
];

export function ExpenseDoughnut({ categories }) {
  const data = {
    labels: categories.map((c) => c.name),
    datasets: [{
      data: categories.map((c) => c.total),
      backgroundColor: COLORS.slice(0, categories.length),
      borderWidth: 0,
      hoverOffset: 8,
    }],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#94A3B8',
          padding: 16,
          font: { size: 12 },
          usePointStyle: true,
        },
      },
      tooltip: {
        callbacks: {
          label: (ctx) => ` ₹${ctx.raw.toLocaleString()}`,
        },
      },
    },
    cutout: '65%',
  };

  return <Doughnut data={data} options={options} />;
}

export function ExpenseBarChart({ monthly }) {
  const data = {
    labels: monthly.map((m) => m.month),
    datasets: [{
      label: 'Total (₹)',
      data: monthly.map((m) => m.total),
      backgroundColor: 'rgba(123, 47, 255, 0.7)',
      borderRadius: 8,
      borderSkipped: false,
    }],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => ` ₹${ctx.raw.toLocaleString()}`,
        },
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(255,255,255,0.05)' },
        ticks: { color: '#94A3B8', font: { size: 11 } },
      },
      y: {
        grid: { color: 'rgba(255,255,255,0.05)' },
        ticks: {
          color: '#94A3B8',
          font: { size: 11 },
          callback: (v) => `₹${v}`,
        },
      },
    },
  };

  return <Bar data={data} options={options} />;
}
