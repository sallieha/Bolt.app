import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { LayoutDashboard, Target, Calendar as CalendarIcon, Clock, LogOut } from 'lucide-react';

function Layout() {
  const location = useLocation();
  const { signOut } = useAuthStore();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Goals', href: '/goals', icon: Target },
    { name: 'Calendar', href: '/calendar', icon: CalendarIcon },
    { name: 'Planner', href: '/planner', icon: Clock },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900">
      <div className="flex h-screen">
        {/* Desktop Sidebar */}
        <div className="hidden md:relative md:flex md:w-16 bg-black/20 backdrop-blur-xl border-r border-white/10 flex-col items-center py-4 z-20 h-full">
          <div className="flex-1 space-y-4">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.name} className="relative group">
                  <Link
                    to={item.href}
                    className={`
                      flex items-center justify-center w-10 h-10 rounded-full transition-all
                      ${location.pathname === item.href
                        ? 'bg-white/20 text-white'
                        : 'text-gray-300 hover:bg-white/10 hover:text-white'
                      }
                    `}
                  >
                    <Icon className="h-5 w-5" />
                  </Link>
                  {/* Tooltip */}
                  <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 hidden group-hover:block z-50">
                    <div className="bg-black/80 backdrop-blur-sm text-white text-sm px-2 py-1 rounded shadow-lg border border-white/10">
                      {item.name}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="relative group">
            <button
              onClick={signOut}
              className="flex items-center justify-center w-10 h-10 rounded-full text-red-400 hover:bg-red-500/10"
            >
              <LogOut className="h-5 w-5" />
            </button>
            {/* Tooltip */}
            <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 hidden group-hover:block z-50">
              <div className="bg-black/80 backdrop-blur-sm text-white text-sm px-2 py-1 rounded shadow-lg border border-white/10">
                Sign Out
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-auto pb-20 md:pb-0">
          <main className="p-8">
            <div className="bg-black/20 backdrop-blur-xl rounded-xl border border-white/10 p-6">
              <Outlet />
            </div>
          </main>
        </div>

        {/* Mobile Footer Navigation */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-black/20 backdrop-blur-xl border-t border-white/10 z-20">
          <div className="flex items-center justify-around px-4 py-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`
                    flex flex-col items-center justify-center p-2 rounded-lg transition-all
                    ${location.pathname === item.href
                      ? 'text-white bg-white/10'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }
                  `}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-xs mt-1">{item.name}</span>
                </Link>
              );
            })}
            <button
              onClick={signOut}
              className="flex flex-col items-center justify-center p-2 rounded-lg text-red-400 hover:bg-red-500/10"
            >
              <LogOut className="h-5 w-5" />
              <span className="text-xs mt-1">Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Layout;