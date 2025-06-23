import React, { useState, useEffect } from 'react';
import { useGoalStore } from '../stores/goalStore';
import { useMoodStore } from '../stores/moodStore';
import { useCalendarStore } from '../stores/calendarStore';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isBefore, isAfter, parseISO, isEqual, isToday as isDateToday, addMonths, subMonths } from 'date-fns';
import { CheckCircle2, XCircle, Smile, Meh, Frown, ChevronLeft, ChevronRight, Search, ChevronDown, ChevronUp, Download, Calendar as CalendarIcon } from 'lucide-react';

function CalendarPage() {
  const { goals, completions, misses, fetchGoals, fetchCompletions, fetchMisses, toggleGoalCompletion, markGoalMissed } = useGoalStore();
  const { moods, todaysMood, fetchTodaysMood, fetchMonthMoods, setTodaysMood } = useMoodStore();
  const { downloading, downloadCalendar } = useCalendarStore();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showMissForm, setShowMissForm] = useState(false);
  const [showMoodForm, setShowMoodForm] = useState(false);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [moodRating, setMoodRating] = useState<number>(5);
  const [missFormData, setMissFormData] = useState({ goalId: '', reason: '', improvement_plan: '' });
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        const start = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
        const end = format(endOfMonth(currentMonth), 'yyyy-MM-dd');

        await Promise.all([
          fetchGoals(),
          fetchCompletions(start, end),
          fetchMisses(start, end),
          fetchMonthMoods(start, end),
          fetchTodaysMood()
        ]);
      } catch (err) {
        console.error('Error loading calendar data:', err);
        setError('Failed to load calendar data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [currentMonth]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showExportDropdown && !(event.target as Element).closest('.export-dropdown')) {
        setShowExportDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showExportDropdown]);

  const handlePreviousMonth = () => setCurrentMonth(prev => subMonths(prev, 1));
  const handleNextMonth = () => setCurrentMonth(prev => addMonths(prev, 1));

  const firstDayOfMonth = startOfMonth(currentMonth);
  const lastDayOfMonth = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: firstDayOfMonth, end: lastDayOfMonth });
  const firstDayOffset = firstDayOfMonth.getDay();

  const getGoalsForDate = (date: Date) => {
    const dayOfWeek = format(date, 'EEEE');
    const dateStr = format(date, 'yyyy-MM-dd');
    
    return goals.filter(goal => {
      const startDate = parseISO(goal.start_date);
      const endDate = goal.end_date ? parseISO(goal.end_date) : null;
      const isAfterStart = !isBefore(date, startDate);
      const isBeforeEnd = endDate ? !isAfter(date, endDate) : true;
      
      return isAfterStart && isBeforeEnd && goal.frequency.includes(dayOfWeek);
    }).filter(goal => 
      searchQuery === '' || 
      goal.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const isGoalCompleted = (goalId: string, date: string) => {
    return completions.some(c => c.goal_id === goalId && c.completed_date === date);
  };

  const isGoalMissed = (goalId: string, date: string) => {
    return misses.some(m => m.goal_id === goalId && m.missed_date === date);
  };

  const handleGoalAction = async (goalId: string, date: string, action: 'complete' | 'miss') => {
    try {
      setError(null);
      setSelectedDate(new Date(date));
      
      if (action === 'complete') {
        await toggleGoalCompletion(goalId, date);
      } else {
        setMissFormData({ goalId, reason: '', improvement_plan: '' });
        setShowMissForm(true);
      }
    } catch (err) {
      console.error('Error handling goal action:', err);
      setError('Failed to update goal status. Please try again.');
    }
  };

  const handleMissSubmit = async () => {
    if (selectedDate && missFormData.goalId) {
      try {
        setError(null);
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        await markGoalMissed(
          missFormData.goalId,
          dateStr,
          missFormData.reason,
          missFormData.improvement_plan
        );
        
        // Refresh data after submitting
        const start = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
        const end = format(endOfMonth(currentMonth), 'yyyy-MM-dd');
        await Promise.all([
          fetchCompletions(start, end),
          fetchMisses(start, end)
        ]);
        
        setShowMissForm(false);
        setMissFormData({ goalId: '', reason: '', improvement_plan: '' });
      } catch (err) {
        console.error('Error submitting miss:', err);
        setError('Failed to mark goal as missed. Please try again.');
      }
    }
  };

  const toggleDateExpansion = (dateStr: string) => {
    const newExpandedDates = new Set(expandedDates);
    if (newExpandedDates.has(dateStr)) {
      newExpandedDates.delete(dateStr);
    } else {
      newExpandedDates.add(dateStr);
    }
    setExpandedDates(newExpandedDates);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white">Loading calendar...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400">
        <p>{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 text-sm hover:text-red-300 transition-colors"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white">
              {format(currentMonth, 'MMMM yyyy')}
            </h1>
            <p className="text-gray-400 mt-1">Ready for today's Goals?</p>
          </div>
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
              <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
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
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search for some activities"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div className="bg-black/20 backdrop-blur-xl rounded-xl border border-white/10">
        <div className="p-6">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center space-x-4">
              <button 
                onClick={handlePreviousMonth}
                className="p-2 hover:bg-white/5 rounded-full text-white transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button 
                onClick={handleNextMonth}
                className="p-2 hover:bg-white/5 rounded-full text-white transition-colors"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 mb-4">
            {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((day) => (
              <div key={day} className="text-center text-sm font-medium text-gray-400">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: firstDayOffset }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}

            {daysInMonth.map((date) => {
              const dateStr = format(date, 'yyyy-MM-dd');
              const dayGoals = getGoalsForDate(date);
              const isToday = isDateToday(date);
              const isSelected = selectedDate && isEqual(date, selectedDate);
              const isExpanded = expandedDates.has(dateStr);

              return (
                <div
                  key={dateStr}
                  className={`
                    aspect-square p-2 rounded-xl transition-all
                    ${isSelected ? 'bg-white/10 ring-2 ring-indigo-500' : 'hover:bg-white/5'}
                    ${isToday ? 'border border-indigo-500' : 'border border-white/5'}
                  `}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className={`text-sm font-medium ${isToday ? 'text-indigo-400' : 'text-white'}`}>
                      {format(date, 'd')}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {dayGoals.map((goal, index) => {
                      if (!isExpanded && index >= 3) return null;
                      const isCompleted = isGoalCompleted(goal.id, dateStr);
                      const isMissed = isGoalMissed(goal.id, dateStr);

                      return (
                        <div
                          key={goal.id}
                          className={`
                            text-left text-xs p-1.5 rounded-md truncate flex items-center justify-between gap-1
                            transition-colors hover:bg-white/10
                            ${isCompleted ? 'bg-green-500/10 text-green-400' : 
                              isMissed ? 'bg-red-500/10 text-red-400' : 'bg-white/5 text-white'}
                          `}
                        >
                          <div className="flex items-center gap-1 min-w-0">
                            <span className="w-2 h-2 flex-shrink-0 rounded-full" style={{ backgroundColor: goal.color }} />
                            <span className="truncate">{goal.title}</span>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {isCompleted && <CheckCircle2 className="h-3 w-3 text-green-400" />}
                            {isMissed && <XCircle className="h-3 w-3 text-red-400" />}
                            {!isCompleted && !isMissed && (
                              <>
                                <button
                                  onClick={() => handleGoalAction(goal.id, dateStr, 'complete')}
                                  className="p-0.5 rounded hover:bg-white/10"
                                >
                                  <CheckCircle2 className="h-3 w-3 text-gray-400 hover:text-green-400" />
                                </button>
                                <button
                                  onClick={() => handleGoalAction(goal.id, dateStr, 'miss')}
                                  className="p-0.5 rounded hover:bg-white/10"
                                >
                                  <XCircle className="h-3 w-3 text-gray-400 hover:text-red-400" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {dayGoals.length > 3 && !isExpanded && (
                      <button
                        onClick={() => toggleDateExpansion(dateStr)}
                        className="w-full text-xs text-gray-400 hover:text-white transition-colors flex items-center justify-center gap-1 p-1"
                      >
                        <ChevronDown className="h-3 w-3" />
                        <span>+{dayGoals.length - 3} more</span>
                      </button>
                    )}
                    {isExpanded && (
                      <button
                        onClick={() => toggleDateExpansion(dateStr)}
                        className="w-full text-xs text-gray-400 hover:text-white transition-colors flex items-center justify-center gap-1 p-1"
                      >
                        <ChevronUp className="h-3 w-3" />
                        <span>Show less</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
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

export default CalendarPage;