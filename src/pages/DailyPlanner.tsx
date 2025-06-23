import React, { useState, useEffect, useRef } from 'react';
import { Plus, Clock, Trash2, AlertCircle, Target } from 'lucide-react';
import { useDailyPlannerStore } from '../stores/dailyPlannerStore';
import { useGoalStore } from '../stores/goalStore';
import { useAuthStore } from '../stores/authStore';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

function DailyPlanner() {
  const { tasks, loading, error, fetchTasks, addTask, deleteTask, clearError } = useDailyPlannerStore();
  const { goals, fetchGoals } = useGoalStore();
  const { user, isLoading: authLoading } = useAuthStore();
  const navigate = useNavigate();
  const [newTask, setNewTask] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const timelineRef = useRef<HTMLDivElement>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const hours = Array.from({ length: 24 }, (_, i) => 
    `${i.toString().padStart(2, '0')}:00`
  );

  const HOUR_HEIGHT = 100;

  const getTaskPosition = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    return (hours * 60 + minutes) * (HOUR_HEIGHT / 60);
  };

  const getTaskHeight = (startTime: string, endTime: string) => {
    const start = getTaskPosition(startTime);
    const end = getTaskPosition(endTime);
    return end - start;
  };

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate('/login');
        return;
      }
      
      if (isInitialLoad || user) {
        const loadData = async () => {
          try {
            await Promise.all([
              fetchGoals(),
              fetchTasks(selectedDate)
            ]);
          } catch (error) {
            console.error('Error loading data:', error);
          }
          setIsInitialLoad(false);
        };
        loadData();
      }
    }
  }, [selectedDate, user, authLoading, navigate, isInitialLoad]);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim() || !user) return;
    
    try {
      await addTask({
        content: newTask.trim(),
        startTime,
        endTime,
        date: format(selectedDate, 'yyyy-MM-dd')
      });
      setNewTask('');
    } catch (error) {
      console.error('Failed to add task:', error);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Daily Planner</h1>
        <input
          type="date"
          value={format(selectedDate, 'yyyy-MM-dd')}
          onChange={(e) => setSelectedDate(new Date(e.target.value))}
          className="bg-white/5 border-white/10 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-400" />
          <p className="text-red-400">{error}</p>
          <button
            onClick={clearError}
            className="ml-auto text-red-400 hover:text-red-300"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="bg-[#1a1f36] rounded-xl border border-white/10 p-4">
        <form onSubmit={handleAddTask} className="flex items-end gap-3">
          <div className="flex-1">
            <input
              type="text"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              placeholder="Task description"
              className="w-full bg-white/5 border-white/10 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
            />
          </div>
          <div className="w-32">
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full bg-white/5 border-white/10 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
            />
          </div>
          <div className="w-32">
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              min={startTime}
              className="w-full bg-white/5 border-white/10 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2 text-sm"
            disabled={loading}
          >
            <Plus className="h-4 w-4" />
            Add
          </button>
        </form>
      </div>

      <div className="bg-[#1a1f36] rounded-xl border border-white/10 overflow-hidden h-[calc(100vh-16rem)]">
        <div className="p-4 border-b border-white/10 bg-[#1a1f36] sticky top-0 z-10">
          <h2 className="text-lg font-medium text-white flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Timeline
          </h2>
        </div>
        
        <div className="flex h-[calc(100%-4rem)] overflow-y-auto custom-scrollbar">
          <div className="w-20 flex-shrink-0 border-r border-white/10">
            {hours.map(hour => (
              <div 
                key={hour}
                className="flex items-center justify-center text-sm text-gray-400 border-b border-white/5"
                style={{ height: `${HOUR_HEIGHT}px` }}
              >
                {hour}
              </div>
            ))}
          </div>
          
          <div 
            ref={timelineRef}
            className="flex-1 relative"
            style={{ minHeight: `${HOUR_HEIGHT * 24}px` }}
          >
            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <div className="text-white">Loading tasks...</div>
              </div>
            ) : (
              tasks.map((task) => {
                const taskStyle = task.isGoal 
                  ? { backgroundColor: `${task.color}20`, borderColor: task.color }
                  : { backgroundColor: 'rgba(79, 70, 229, 0.2)', borderColor: 'rgba(79, 70, 229, 0.3)' };

                return (
                  <div
                    key={task.id}
                    style={{
                      position: 'absolute',
                      top: `${getTaskPosition(task.startTime)}px`,
                      left: 0,
                      right: 16,
                      height: `${getTaskHeight(task.startTime, task.endTime)}px`,
                      minHeight: '60px',
                      ...taskStyle
                    }}
                    className="flex flex-col justify-between backdrop-blur-sm border rounded-lg p-4 group transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {task.isGoal && <Target className="h-5 w-5" style={{ color: task.color }} />}
                        <span className="text-white font-medium">{task.content}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400 text-sm">
                          {task.startTime} - {task.endTime}
                        </span>
                        {!task.isGoal && (
                          <button
                            onClick={() => deleteTask(task.id)}
                            className="text-gray-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DailyPlanner;