import React, { useState, useEffect } from 'react';
import { PlusCircle, Smile, Meh, Frown, CheckCircle2, XCircle, Settings, ChevronLeft, ChevronRight, Eye, EyeOff, Trophy, Medal, Target, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useMoodStore } from '../stores/moodStore';
import { useGoalStore } from '../stores/goalStore';
import { format, startOfMonth, endOfMonth, addMonths, subMonths, eachDayOfInterval, eachMonthOfInterval, startOfWeek, endOfWeek, addDays, parseISO, formatDistanceToNow } from 'date-fns';
import { Line, Bar } from 'react-chartjs-2';
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

interface MissFormData {
  goalId: string;
  reason: string;
  improvement_plan: string;
}

const activityFeed = [
  {
    id: 1,
    action: 'completed',
    count: 51,
    timestamp: new Date(Date.now() - 1000 * 60 * 15),
    icon: Trophy,
    color: 'text-yellow-400',
  },
  {
    id: 2,
    action: 'logged',
    count: 120,
    timestamp: new Date(Date.now() - 1000 * 60 * 45),
    icon: Medal,
    color: 'text-blue-400',
  },
  {
    id: 3,
    action: 'started',
    goal: 'Learn Spanish',
    target: '30 minutes daily practice',
    timestamp: new Date(Date.now() - 1000 * 60 * 60),
    icon: Target,
    color: 'text-green-400',
  },
];

function Dashboard() {
  const [moodRating, setMoodRating] = useState<number>(5);
  const [showMissForm, setShowMissForm] = useState(false);
  const [showMoodAdjust, setShowMoodAdjust] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [missFormData, setMissFormData] = useState<MissFormData>({ goalId: '', reason: '', improvement_plan: '' });
  const [showHiddenMisses, setShowHiddenMisses] = useState(false);
  const [hiddenMisses, setHiddenMisses] = useState<Set<string>>(new Set());

  const { 
    todaysMood, 
    moods, 
    setTodaysMood, 
    fetchTodaysMood, 
    fetchMonthMoods,
    error: moodError,
    clearError: clearMoodError 
  } = useMoodStore();

  const { 
    goals, 
    completions, 
    misses, 
    fetchGoals, 
    fetchCompletions, 
    fetchMisses, 
    toggleGoalCompletion, 
    markGoalMissed, 
    getGoalCompletionRate,
    error: goalError,
    clearError: clearGoalError
  } = useGoalStore();

  useEffect(() => {
    const loadData = async () => {
      try {
        clearMoodError();
        clearGoalError();

        const today = format(new Date(), 'yyyy-MM-dd');
        const monthStart = format(startOfMonth(selectedMonth), 'yyyy-MM-dd');
        const monthEnd = format(endOfMonth(selectedMonth), 'yyyy-MM-dd');

        await fetchTodaysMood();
        if (todaysMood) {
          setMoodRating(parseInt(todaysMood.mood));
        }

        await Promise.all([
          fetchGoals(),
          fetchCompletions(monthStart, monthEnd),
          fetchMisses(monthStart, monthEnd),
          fetchMonthMoods(monthStart, monthEnd)
        ]);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      }
    };

    loadData();
  }, [selectedMonth]);

  const todaysGoals = goals.filter(goal => {
    const today = new Date().getDay();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return goal.frequency.includes(dayNames[today]);
  });

  const handleMoodSubmit = async () => {
    try {
      clearMoodError();
      await setTodaysMood(moodRating.toString());
      setShowMoodAdjust(false);
      
      const monthStart = format(startOfMonth(selectedMonth), 'yyyy-MM-dd');
      const monthEnd = format(endOfMonth(selectedMonth), 'yyyy-MM-dd');
      await fetchMonthMoods(monthStart, monthEnd);
    } catch (error) {
      console.error('Failed to save mood:', error);
    }
  };

  const handleGoalAction = async (goalId: string, action: 'complete' | 'miss') => {
    const today = format(new Date(), 'yyyy-MM-dd');
    if (action === 'complete') {
      await toggleGoalCompletion(goalId, today);
    } else {
      setMissFormData({ goalId, reason: '', improvement_plan: '' });
      setShowMissForm(true);
    }
  };

  const handleMissSubmit = async () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    await markGoalMissed(
      missFormData.goalId,
      today,
      missFormData.reason,
      missFormData.improvement_plan
    );
    setShowMissForm(false);
    setMissFormData({ goalId: '', reason: '', improvement_plan: '' });
  };

  const getGoalStatus = (goalId: string) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const completed = completions.some(c => c.goal_id === goalId && c.completed_date === today);
    const missed = misses.some(m => m.goal_id === goalId && m.missed_date === today);
    return { completed, missed };
  };

  const getMoodEmoji = (rating: number) => {
    if (rating >= 8) return <Smile className="h-8 w-8 text-green-500" />;
    if (rating >= 4) return <Meh className="h-8 w-8 text-yellow-500" />;
    return <Frown className="h-8 w-8 text-red-500" />;
  };

  const getMoodColor = (mood: number | null) => {
    if (mood === null) return 'bg-white';
    if (mood >= 8) return 'bg-green-50 hover:bg-green-100';
    if (mood >= 4) return 'bg-yellow-50 hover:bg-yellow-100';
    return 'bg-red-50 hover:bg-red-100';
  };

  const toggleMissVisibility = (missId: string) => {
    const newHiddenMisses = new Set(hiddenMisses);
    if (newHiddenMisses.has(missId)) {
      newHiddenMisses.delete(missId);
    } else {
      newHiddenMisses.add(missId);
    }
    setHiddenMisses(newHiddenMisses);
  };

  const getTotalCompletionRate = (date = selectedMonth) => {
    const monthStart = startOfMonth(date);
    let totalCompleted = 0;
    let totalPossible = 0;

    goals.forEach(goal => {
      const rate = getGoalCompletionRate(goal.id, monthStart);
      totalCompleted += rate;
      totalPossible += 100;
    });

    return totalPossible > 0 ? Math.round(totalCompleted / goals.length) : 0;
  };

  const handlePreviousMonth = () => {
    setSelectedMonth(prev => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    setSelectedMonth(prev => addMonths(prev, 1));
  };

  const getWeeklyStats = () => {
    if (!Array.isArray(goals) || !Array.isArray(completions) || !Array.isArray(moods)) {
      return {
        moodAverages: Array(7).fill(null),
        completionRates: Array(7).fill(0)
      };
    }

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const dayStats = days.map(() => ({
      moods: [] as number[],
      completions: 0,
      totalGoals: 0
    }));

    const start = startOfMonth(selectedMonth);
    const end = endOfMonth(selectedMonth);
    const daysInMonth = eachDayOfInterval({ start, end });

    moods.forEach(mood => {
      const moodDate = new Date(mood.created_at);
      if (moodDate >= start && moodDate <= end) {
        const dayIndex = (moodDate.getDay() + 6) % 7;
        const moodValue = parseInt(mood.mood);
        if (!isNaN(moodValue)) {
          dayStats[dayIndex].moods.push(moodValue);
        }
      }
    });

    daysInMonth.forEach(date => {
      const dayIndex = (date.getDay() + 6) % 7;
      const dateStr = format(date, 'yyyy-MM-dd');
      
      const dayGoals = goals.filter(goal => goal.frequency.includes(days[dayIndex]));
      dayStats[dayIndex].totalGoals += dayGoals.length;

      const completedGoals = completions.filter(c => 
        c.completed_date === dateStr && 
        dayGoals.some(g => g.id === c.goal_id)
      ).length;
      
      dayStats[dayIndex].completions += completedGoals;
    });

    return {
      moodAverages: dayStats.map(day => 
        day.moods.length > 0 
          ? Number((day.moods.reduce((a, b) => a + b, 0) / day.moods.length).toFixed(1))
          : null
      ),
      completionRates: dayStats.map(day => 
        day.totalGoals > 0 
          ? Number(((day.completions / day.totalGoals) * 100).toFixed(1))
          : 0
      )
    };
  };

  const getMonthlyStats = () => {
    const months = eachMonthOfInterval({
      start: subMonths(new Date(), 3),
      end: new Date()
    });

    return months.map(month => ({
      month: format(month, 'MMM yyyy'),
      rate: getTotalCompletionRate(month)
    }));
  };

  const { moodAverages, completionRates } = getWeeklyStats();
  const monthlyStats = getMonthlyStats();
  const completionRate = getTotalCompletionRate();

  const chartData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Average Mood',
        data: moodAverages,
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
        fill: false,
        spanGaps: true,
        borderWidth: 2,
        yAxisID: 'y'
      },
      {
        label: 'Task Completion (%)',
        data: completionRates,
        borderColor: '#4F46E5',
        backgroundColor: 'rgba(79, 70, 229, 0.1)',
        tension: 0.4,
        fill: false,
        borderWidth: 2,
        yAxisID: 'percentage'
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    scales: {
      y: {
        beginAtZero: true,
        max: 10,
        position: 'left',
        title: {
          display: true,
          text: 'Mood (1-10)',
          color: 'rgba(255, 255, 255, 0.8)'
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.8)'
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        }
      },
      percentage: {
        beginAtZero: true,
        max: 100,
        position: 'right',
        title: {
          display: true,
          text: 'Completion Rate (%)',
          color: 'rgba(255, 255, 255, 0.8)'
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.8)'
        },
        grid: {
          drawOnChartArea: false
        }
      },
      x: {
        ticks: {
          color: 'rgba(255, 255, 255, 0.8)'
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        }
      }
    },
    plugins: {
      legend: {
        position: 'top' as const,
        align: 'start' as const,
        labels: {
          color: 'rgba(255, 255, 255, 0.8)',
          boxWidth: 16,
          usePointStyle: true,
          pointStyle: 'rect'
        }
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            if (label.includes('Completion')) {
              return `${label}: ${value.toFixed(1)}%`;
            }
            return value !== null ? `${label}: ${value.toFixed(1)}` : `${label}: No data`;
          }
        }
      }
    },
    elements: {
      point: {
        radius: 0,
        hoverRadius: 6
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center gap-4">
        <h1 className="text-xl md:text-2xl font-bold text-white truncate">Dashboard</h1>
        <Link
          to="/goals"
          className="inline-flex items-center px-3 md:px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 whitespace-nowrap"
        >
          <PlusCircle className="h-4 w-4 md:h-5 md:w-5 mr-1 md:mr-2" />
          <span className="hidden xs:inline">Add New Goal</span>
          <span className="xs:hidden">Add Goal</span>
        </Link>
      </div>

      <div className="bg-black/20 backdrop-blur-xl rounded-lg border border-white/10 p-6">
        <h2 className="text-lg font-medium text-white mb-4">Community Wins</h2>
        <div className="space-y-3">
          {activityFeed.map((activity) => {
            const Icon = activity.icon;
            return (
              <div key={activity.id} className="flex items-center space-x-3">
                <Icon className={`h-5 w-5 ${activity.color} flex-shrink-0`} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-400 flex-shrink-0">
                      {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                    </span>
                  </div>
                  <div className="mt-1 text-sm text-gray-300 overflow-x-auto whitespace-nowrap scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent pb-2">
                    {activity.action === 'completed' && (
                      <>
                        {activity.count} people completed goals today!
                      </>
                    )}
                    {activity.action === 'logged' && (
                      <>
                        {activity.count} people logged on today
                      </>
                    )}
                    {activity.action === 'started' && (
                      <>
                        Someone started <span className="font-medium">{activity.goal}</span>
                        {activity.target && (
                          <span className="ml-1">
                            - Goal: {activity.target}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                  <User className="h-5 w-5 text-white/60" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-black/20 backdrop-blur-xl rounded-lg border border-white/10 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white">Overall Completion</h2>
            <div className="flex items-center space-x-4">
              <button onClick={handlePreviousMonth} className="p-1 hover:bg-white/10 rounded text-white">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <span className="text-lg font-medium text-white">
                {format(selectedMonth, 'MMMM yyyy')}
              </span>
              <button onClick={handleNextMonth} className="p-1 hover:bg-white/10 rounded text-white">
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex-none">
              <div className="relative w-32 h-32">
                <svg className="w-full h-full" viewBox="0 0 36 36">
                  <path
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.1)"
                    strokeWidth="3"
                  />
                  <path
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#4F46E5"
                    strokeWidth="3"
                    strokeDasharray={`${completionRate}, 100`}
                  />
                  <text
                    x="18"
                    y="20"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#4F46E5"
                    fontSize="6"
                    fontWeight="bold"
                  >
                    {completionRate}%
                  </text>
                </svg>
              </div>
            </div>

            <div className="flex-grow space-y-3">
              {goals.map(goal => {
                const rate = Math.round(getGoalCompletionRate(goal.id, startOfMonth(selectedMonth)));
                return (
                  <div key={goal.id} className="flex items-center space-x-4">
                    <div className="flex-grow">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-white">{goal.title}</span>
                        <span className="text-sm font-medium text-white">{rate}%</span>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${rate}%`,
                            backgroundColor: goal.color,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="bg-black/20 backdrop-blur-xl rounded-lg border border-white/10 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-white">How are you feeling today?</h2>
            <button
              onClick={() => setShowMoodAdjust(true)}
              className="text-gray-400 hover:text-white"
            >
              <Settings className="h-5 w-5" />
            </button>
          </div>
          {(!showMoodAdjust && todaysMood) ? (
            <div className="flex items-center justify-center space-x-4">
              <div className="flex items-center justify-center">
                {getMoodEmoji(parseInt(todaysMood.mood))}
              </div>
              <p className="text-lg text-white">
                Your mood today: <span className="font-medium">{todaysMood.mood}/10</span>
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={moodRating}
                  onChange={(e) => setMoodRating(parseInt(e.target.value))}
                  className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-lg font-medium text-white">{moodRating}/10</span>
              </div>
              <div className="flex justify-center">
                {getMoodEmoji(moodRating)}
              </div>
              <button
                onClick={handleMoodSubmit}
                className="w-full mt-4 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
              >
                {showMoodAdjust ? 'Update Mood' : 'Submit Mood'}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="bg-black/20 backdrop-blur-xl rounded-lg border border-white/10 p-6">
        <h2 className="text-lg font-medium text-white mb-4">Today's Goals</h2>
        {todaysGoals.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400">No goals set for today.</p>
            <Link
              to="/goals"
              className="mt-4 inline-flex items-center text-sm font-medium text-indigo-400 hover:text-indigo-300"
            >
              <PlusCircle className="h-5 w-5 mr-1" />
              Add your first goal
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-white/10">
            {todaysGoals.map((goal) => {
              const status = getGoalStatus(goal.id);
              return (
                <div 
                  key={goal.id} 
                  className="py-4 flex items-center justify-between"
                  style={{ borderLeftWidth: '4px', borderLeftStyle: 'solid', borderLeftColor: goal.color, paddingLeft: '1rem' }}
                >
                  <span className="text-white">{goal.title}</span>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleGoalAction(goal.id, 'complete')}
                      className={`p-1 rounded-full ${
                        status.completed ? 'text-green-500 bg-green-500/10' : 'text-gray-400 hover:text-green-500'
                      }`}
                    >
                      <CheckCircle2 className="h-6 w-6" />
                    </button>
                    <button
                      onClick={() => handleGoalAction(goal.id, 'miss')}
                      className={`p-1 rounded-full ${
                        status.missed ? 'text-red-500 bg-red-500/10' : 'text-gray-400 hover:text-red-500'
                      }`}
                    >
                      <XCircle className="h-6 w-6" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-black/20 backdrop-blur-xl rounded-lg border border-white/10 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-white">Missed Goals History</h2>
          <button
            onClick={() => setShowHiddenMisses(!showHiddenMisses)}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            {showHiddenMisses ? (
              <>
                <EyeOff className="h-4 w-4" />
                Hide archived
              </>
            ) : (
              <>
                <Eye className="h-4 w-4" />
                Show archived
              </>
            )}
          </button>
        </div>
        <div className="space-y-4">
          {misses.filter(miss => showHiddenMisses ? hiddenMisses.has(miss.id) : !hiddenMisses.has(miss.id)).map(miss => {
            const goal = goals.find(g => g.id === miss.goal_id);
            if (!goal) return null;
            return (
              <div
                key={miss.id}
                className="bg-red-500/10 rounded-lg p-4 border border-red-500/20"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-red-400">{goal.title}</h3>
                    <p className="text-sm text-red-300 mt-1">
                      Missed on {format(parseISO(miss.missed_date), 'MMM d, yyyy')}
                    </p>
                    {miss.reason && (
                      <p className="text-sm text-red-300 mt-2">
                        <strong>Reason:</strong> {miss.reason}
                      </p>
                    )}
                    {miss.improvement_plan && (
                      <p className="text-sm text-red-300 mt-1">
                        <strong>Plan:</strong> {miss.improvement_plan}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => toggleMissVisibility(miss.id)}
                    className="text-red-400 hover:text-red-300 transition-colors"
                  >
                    {hiddenMisses.has(miss.id) ? (
                      <Eye className="h-5 w-5" />
                    ) : (
                      <EyeOff className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
          {misses.length === 0 && (
            <p className="text-center text-gray-400 py-4">No missed goals found in this period</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-black/20 backdrop-blur-xl rounded-lg border border-white/10 p-6">
          <h2 className="text-lg font-medium text-white mb-4">
            Mood & Task Correlation - {format(selectedMonth, 'MMMM yyyy')}
          </h2>
          <Line data={chartData} options={chartOptions} />
        </div>

        <div className="bg-black/20 backdrop-blur-xl rounded-lg border border-white/10 p-6">
          <h2 className="text-lg font-medium text-white mb-4">Monthly Progress</h2>
          <Bar
            data={{
              labels: monthlyStats.map(stat => stat.month),
              datasets: [
                {
                  label: 'Completion Rate',
                  data: monthlyStats.map(stat => stat.rate),
                  backgroundColor: '#4F46E5'
                }
              ]
            }}
            options={{
              responsive: true,
              scales: {
                y: {
                  beginAtZero: true,
                  max: 100,
                  ticks: {
                    callback: (value) => `${value}%`,
                    color: 'rgba(255, 255, 255, 0.8)'
                  },
                  grid: {
                    color: 'rgba(255, 255, 255, 0.1)'
                  }
                },
                x: {
                  ticks: {
                    color: 'rgba(255, 255, 255, 0.8)'
                  },
                  grid: {
                    color: 'rgba(255, 255, 255, 0.1)'
                  }
                }
              },
              plugins: {
                legend: {
                  display: false
                },
                tooltip: {
                  callbacks: {
                    label: (context) => `Completion Rate: ${context.parsed.y}%`
                  }
                }
              }
            }}
          />
        </div>
      </div>

      {showMissForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-lg shadow-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-white mb-4">Why did you miss this goal?</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white">Reason</label>
                <textarea
                  value={missFormData.reason}
                  onChange={(e) => setMissFormData({ ...missFormData, reason: e.target.value })}
                  className="mt-1 block w-full rounded-md bg-black/20 border-white/10 text-white placeholder-gray-400 focus:border-indigo-500 focus:ring-indigo-500"
                  rows={3}
                  placeholder="What prevented you from completing this goal?"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white">How will you improve?</label>
                <textarea
                  value={missFormData.improvement_plan}
                  onChange={(e) => setMissFormData({ ...missFormData, improvement_plan: e.target.value })}
                  className="mt-1 block w-full rounded-md bg-black/20 border-white/10 text-white placeholder-gray-400 focus:border-indigo-500 focus:ring-indigo-500"
                  rows={3}
                  placeholder="What's your plan to succeed next time?"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowMissForm(false)}
                  className="px-4 py-2 border border-white/10 rounded-md shadow-sm text-sm font-medium text-white hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  onClick={handleMissSubmit}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;