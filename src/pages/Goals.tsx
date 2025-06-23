import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, Settings, Download, Calendar as CalendarIcon, CheckCircle2, ArrowRight } from 'lucide-react';
import { useGoalStore } from '../stores/goalStore';
import { useCalendarStore } from '../stores/calendarStore';
import { format } from 'date-fns';

interface Goal {
  id: string;
  title: string;
  description: string;
  color: string;
  frequency: string[];
  start_date: string;
  end_date: string | null;
  start_time: string;
  end_time: string;
}

function Goals() {
  const { goals, fetchGoals, addGoal, deleteGoal, updateGoal } = useGoalStore();
  const { downloading, downloadCalendar } = useCalendarStore();
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
  // Set default start date to today
  const defaultStartDate = format(new Date(), 'yyyy-MM-dd');
  
  const [newGoal, setNewGoal] = useState<Omit<Goal, 'id'>>({
    title: '',
    description: '',
    color: '#4F46E5',
    frequency: [],
    start_date: defaultStartDate,
    end_date: null,
    start_time: '09:00',
    end_time: '17:00',
  });

  useEffect(() => {
    const loadData = async () => {
      await fetchGoals();
    };
    loadData();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showExportDropdown && !(event.target as Element).closest('.export-dropdown')) {
        setShowExportDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showExportDropdown]);

  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const colorOptions = [
    '#4F46E5', // Indigo
    '#10B981', // Emerald
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#06B6D4', // Cyan
  ];

  const handleAddGoal = async () => {
    if (!newGoal.title) return;
    
    try {
      await addGoal(newGoal);
      setNewGoal({
        title: '',
        description: '',
        color: '#4F46E5',
        frequency: [],
        start_date: defaultStartDate,
        end_date: null,
        start_time: '09:00',
        end_time: '17:00',
      });
      setIsAddingGoal(false);
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Failed to add goal:', error);
    }
  };

  const handleDeleteGoal = async (id: string) => {
    try {
      await deleteGoal(id);
    } catch (error) {
      console.error('Failed to delete goal:', error);
    }
  };

  const handleEditGoal = async () => {
    if (!editingGoal) return;
    try {
      await updateGoal(editingGoal);
      setEditingGoal(null);
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Failed to update goal:', error);
    }
  };

  const handleCancelAdd = () => {
    setNewGoal({
      title: '',
      description: '',
      color: '#4F46E5',
      frequency: [],
      start_date: defaultStartDate,
      end_date: null,
      start_time: '09:00',
      end_time: '17:00',
    });
    setIsAddingGoal(false);
  };

  return (
    <div className="space-y-6">
      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-x-0 top-0 flex items-start justify-center p-4 z-50">
          <div className="fixed inset-0 bg-blue-900/95 backdrop-blur-sm" />
          <div className="bg-black/50 backdrop-blur-xl border border-white/10 rounded-lg shadow-xl p-6 max-w-md w-full mt-20 relative z-10">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-green-500/10 rounded-full p-3">
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
            </div>
            <h3 className="text-xl font-medium text-white text-center mb-4">
              Goal Saved Successfully!
            </h3>
            <p className="text-gray-400 text-center mb-6">
              What would you like to do next?
            </p>
            <div className="space-y-3">
              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  setIsAddingGoal(true);
                }}
                className="w-full flex items-center justify-between px-4 py-3 bg-white/5 hover:bg-white/10 rounded-lg text-white transition-colors"
              >
                <span className="flex items-center">
                  <Plus className="h-5 w-5 mr-3" />
                  Create Another Goal
                </span>
                <ArrowRight className="h-5 w-5" />
              </button>
              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  setShowExportDropdown(true);
                }}
                className="w-full flex items-center justify-between px-4 py-3 bg-white/5 hover:bg-white/10 rounded-lg text-white transition-colors"
              >
                <span className="flex items-center">
                  <Download className="h-5 w-5 mr-3" />
                  Export to Calendar
                </span>
                <ArrowRight className="h-5 w-5" />
              </button>
              <button
                onClick={() => setShowSuccessModal(false)}
                className="w-full px-4 py-3 text-gray-400 hover:text-white transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3">
        <h1 className="text-2xl font-bold text-white">Goals</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAddingGoal(true)}
            className="inline-flex items-center justify-center w-40 h-[38px] px-3 py-2 border border-transparent rounded-md shadow-sm text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Goal
          </button>
          <div className="relative export-dropdown">
            <button
              onClick={() => setShowExportDropdown(!showExportDropdown)}
              disabled={downloading}
              className="inline-flex items-center justify-center w-40 h-[38px] px-3 py-2 border border-transparent rounded-md shadow-sm text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="h-4 w-4 mr-1" />
              {downloading ? 'Exporting...' : 'Export Calendar'}
            </button>
            {showExportDropdown && (
              <div className="absolute left-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                <div className="py-1" role="menu">
                  <button
                    onClick={() => {
                      downloadCalendar('google');
                      setShowExportDropdown(false);
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    role="menuitem"
                  >
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    Google Calendar
                  </button>
                  <button
                    onClick={() => {
                      downloadCalendar('ical');
                      setShowExportDropdown(false);
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    role="menuitem"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    iCalendar (.ics)
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {(isAddingGoal || editingGoal) && (
        <div className="bg-black/20 backdrop-blur-xl rounded-lg border border-white/10 p-6">
          <h2 className="text-lg font-medium text-white mb-4">
            {editingGoal ? 'Edit Goal' : 'New Goal'}
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white">Title</label>
              <input
                type="text"
                value={editingGoal ? editingGoal.title : newGoal.title}
                onChange={(e) => editingGoal 
                  ? setEditingGoal({ ...editingGoal, title: e.target.value })
                  : setNewGoal({ ...newGoal, title: e.target.value })
                }
                className="mt-1 block w-full rounded-md bg-black/20 border border-white/20 text-white placeholder-gray-400 focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white">Description</label>
              <textarea
                value={editingGoal ? editingGoal.description : newGoal.description}
                onChange={(e) => editingGoal
                  ? setEditingGoal({ ...editingGoal, description: e.target.value })
                  : setNewGoal({ ...newGoal, description: e.target.value })
                }
                className="mt-1 block w-full rounded-md bg-black/20 border border-white/20 text-white placeholder-gray-400 focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white">Color</label>
              <div className="mt-2 flex gap-2">
                {colorOptions.map((color) => (
                  <button
                    key={color}
                    onClick={() => editingGoal
                      ? setEditingGoal({ ...editingGoal, color })
                      : setNewGoal({ ...newGoal, color })
                    }
                    className={`w-8 h-8 rounded-full ${
                      (editingGoal ? editingGoal.color : newGoal.color) === color 
                        ? 'ring-2 ring-offset-2 ring-indigo-500' 
                        : ''
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-white">Frequency</label>
              <div className="mt-2 flex flex-wrap gap-2">
                {weekDays.map((day) => (
                  <button
                    key={day}
                    onClick={() => {
                      const currentFrequency = editingGoal ? editingGoal.frequency : newGoal.frequency;
                      const newFrequency = currentFrequency.includes(day)
                        ? currentFrequency.filter((d) => d !== day)
                        : [...currentFrequency, day];
                      
                      editingGoal
                        ? setEditingGoal({ ...editingGoal, frequency: newFrequency })
                        : setNewGoal({ ...newGoal, frequency: newFrequency });
                    }}
                    className={`px-3 py-1 rounded-full text-sm ${
                      (editingGoal ? editingGoal.frequency : newGoal.frequency).includes(day)
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white/5 text-white hover:bg-white/10'
                    }`}
                  >
                    {day.slice(0, 3)}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white">Start Date</label>
                <input
                  type="date"
                  value={editingGoal ? editingGoal.start_date : newGoal.start_date}
                  min={defaultStartDate}
                  onChange={(e) => editingGoal
                    ? setEditingGoal({ ...editingGoal, start_date: e.target.value })
                    : setNewGoal({ ...newGoal, start_date: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md bg-black/20 border border-white/20 text-white focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white">End Date (Optional)</label>
                <input
                  type="date"
                  value={editingGoal ? editingGoal.end_date || '' : newGoal.end_date || ''}
                  min={editingGoal ? editingGoal.start_date : newGoal.start_date}
                  onChange={(e) => {
                    const value = e.target.value || null;
                    editingGoal
                      ? setEditingGoal({ ...editingGoal, end_date: value })
                      : setNewGoal({ ...newGoal, end_date: value });
                  }}
                  className="mt-1 block w-full rounded-md bg-black/20 border border-white/20 text-white focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white">Start Time</label>
                <input
                  type="time"
                  value={editingGoal ? editingGoal.start_time : newGoal.start_time}
                  onChange={(e) => editingGoal
                    ? setEditingGoal({ ...editingGoal, start_time: e.target.value })
                    : setNewGoal({ ...newGoal, start_time: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md bg-black/20 border border-white/20 text-white focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white">End Time</label>
                <input
                  type="time"
                  value={editingGoal ? editingGoal.end_time : newGoal.end_time}
                  onChange={(e) => editingGoal
                    ? setEditingGoal({ ...editingGoal, end_time: e.target.value })
                    : setNewGoal({ ...newGoal, end_time: e.target.value })
                  }
                  min={editingGoal ? editingGoal.start_time : newGoal.start_time}
                  className="mt-1 block w-full rounded-md bg-black/20 border border-white/20 text-white focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  editingGoal ? setEditingGoal(null) : handleCancelAdd();
                }}
                className="px-4 py-2 border border-white/10 rounded-md shadow-sm text-sm font-medium text-white hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                onClick={editingGoal ? handleEditGoal : handleAddGoal}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
              >
                {editingGoal ? 'Save Changes' : 'Save Goal'}
              </button>
            </div>
          </div>
        </div>
      )}

      {goals.length === 0 && !isAddingGoal ? (
        <div className="text-center py-12 bg-black/20 backdrop-blur-xl rounded-lg border border-white/10">
          <h3 className="text-lg font-medium text-white mb-2">No goals yet</h3>
          <p className="text-gray-400 mb-4">Start by adding your first goal</p>
          <button
            onClick={() => setIsAddingGoal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Goal
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {goals.map((goal) => (
            <div
              key={goal.id}
              className="bg-black/20 backdrop-blur-xl rounded-lg border border-white/10 p-6"
              style={{ borderLeft: `4px solid ${goal.color}` }}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-medium text-white">{goal.title}</h3>
                  <p className="mt-1 text-sm text-gray-400">{goal.description}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {goal.frequency.map((day) => (
                      <span
                        key={day}
                        className="px-2 py-1 rounded-full bg-white/5 text-xs font-medium text-white"
                      >
                        {day.slice(0, 3)}
                      </span>
                    ))}
                  </div>
                  <div className="mt-2 text-sm text-gray-400 space-y-1">
                    <p>Starts: {new Date(goal.start_date).toLocaleDateString()}</p>
                    {goal.end_date && (
                      <p>Ends: {new Date(goal.end_date).toLocaleDateString()}</p>
                    )}
                    <p>Time: {goal.start_time} - {goal.end_time}</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setEditingGoal(goal)}
                    className="p-2 text-gray-400 hover:text-white"
                  >
                    <Settings className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteGoal(goal.id)}
                    className="p-2 text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Goals;