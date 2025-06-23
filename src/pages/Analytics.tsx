import React, { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { useGoalStore } from '../stores/goalStore';
import { useMoodStore } from '../stores/moodStore';
import { format, subDays } from 'date-fns';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

function Analytics() {
  const { goals, completions, fetchGoals, fetchCompletions } = useGoalStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const today = format(new Date(), 'yyyy-MM-dd');
      const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd');
      
      await Promise.all([
        fetchGoals(),
        fetchCompletions(thirtyDaysAgo, today),
      ]);
      
      setLoading(false);
    };

    loadData();
  }, []);

  if (loading || goals.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        </div>
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500">
            {loading ? 'Loading analytics...' : 'No data available yet. Start by adding some goals!'}
          </p>
        </div>
      </div>
    );
  }

  // Calculate completion rates for the last 7 days
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), i);
    return format(date, 'EEE');
  }).reverse();

  const completionData = last7Days.map(day => {
    const date = format(new Date(new Date().setDate(new Date().getDate() - last7Days.indexOf(day))), 'yyyy-MM-dd');
    const dayCompletions = completions.filter(c => c.completed_date === date).length;
    const totalGoals = goals.length;
    return (totalGoals > 0 ? (dayCompletions / totalGoals) * 100 : 0);
  });

  const progressData = {
    labels: last7Days,
    datasets: [
      {
        label: 'Completion Rate (%)',
        data: completionData,
        borderColor: 'rgb(79, 70, 229)',
        backgroundColor: 'rgba(79, 70, 229, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  // Calculate monthly stats
  const monthlyData = {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    datasets: [
      {
        label: 'Goals Completed',
        data: [
          completions.filter(c => parseInt(c.completed_date.split('-')[2]) <= 7).length,
          completions.filter(c => parseInt(c.completed_date.split('-')[2]) > 7 && parseInt(c.completed_date.split('-')[2]) <= 14).length,
          completions.filter(c => parseInt(c.completed_date.split('-')[2]) > 14 && parseInt(c.completed_date.split('-')[2]) <= 21).length,
          completions.filter(c => parseInt(c.completed_date.split('-')[2]) > 21).length,
        ],
        backgroundColor: 'rgba(79, 70, 229, 0.8)',
      },
    ],
  };

  // Calculate overall stats
  const totalCompletions = completions.length;
  const totalPossible = goals.length * 30; // 30 days
  const overallCompletionRate = totalPossible > 0 ? Math.round((totalCompletions / totalPossible) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Progress */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Weekly Progress</h2>
          <Line
            data={progressData}
            options={{
              responsive: true,
              scales: {
                y: {
                  beginAtZero: true,
                  max: 100,
                  ticks: {
                    callback: (value) => `${value}%`,
                  },
                },
              },
              plugins: {
                tooltip: {
                  callbacks: {
                    label: (context) => `Completion Rate: ${Math.round(context.parsed.y)}%`,
                  },
                },
              },
            }}
          />
        </div>

        {/* Monthly Overview */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Monthly Overview</h2>
          <Bar
            data={monthlyData}
            options={{
              responsive: true,
              scales: {
                y: {
                  beginAtZero: true,
                },
              },
            }}
          />
        </div>

        {/* Statistics Summary */}
        <div className="bg-white rounded-lg shadow p-6 lg:col-span-2">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Statistics Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-500">Total Goals</h3>
              <p className="mt-2 text-2xl font-bold text-indigo-600">{goals.length}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-500">Completions</h3>
              <p className="mt-2 text-2xl font-bold text-indigo-600">{totalCompletions}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-500">Overall Rate</h3>
              <p className="mt-2 text-2xl font-bold text-indigo-600">{overallCompletionRate}%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Analytics;