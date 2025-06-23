import React from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';

function Progress() {
  const tasks = [
    { id: 1, title: 'Morning Meditation', completed: true },
    { id: 2, title: 'Read 30 minutes', completed: false },
    { id: 3, title: 'Exercise', completed: true },
    { id: 4, title: 'Practice Guitar', completed: false },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Progress Tracking</h1>
      </div>

      {/* Streak Information */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900">Current Streak</h3>
          <div className="mt-2 flex items-baseline">
            <p className="text-3xl font-bold text-indigo-600">7</p>
            <p className="ml-2 text-sm text-gray-500">days</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900">Longest Streak</h3>
          <div className="mt-2 flex items-baseline">
            <p className="text-3xl font-bold text-indigo-600">15</p>
            <p className="ml-2 text-sm text-gray-500">days</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900">Completion Rate</h3>
          <div className="mt-2 flex items-baseline">
            <p className="text-3xl font-bold text-indigo-600">85%</p>
            <p className="ml-2 text-sm text-gray-500">this week</p>
          </div>
        </div>
      </div>

      {/* Today's Tasks */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Today's Tasks</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {tasks.map((task) => (
            <div key={task.id} className="px-6 py-4 flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-gray-900">{task.title}</span>
              </div>
              {task.completed ? (
                <CheckCircle2 className="h-6 w-6 text-green-500" />
              ) : (
                <XCircle className="h-6 w-6 text-red-500" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Missed Goals */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Missed Goals</h2>
        </div>
        <div className="p-6">
          <div className="text-center text-gray-500 py-4">
            No missed goals for today! Keep up the good work!
          </div>
        </div>
      </div>
    </div>
  );
}

export default Progress;