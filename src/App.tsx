import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { useAnalytics } from './hooks/useAnalytics';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Goals from './pages/Goals';
import Calendar from './pages/Calendar';
import DailyPlanner from './pages/DailyPlanner';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function RouteTracker() {
  const location = useLocation();
  const { trackPageView } = useAnalytics();

  React.useEffect(() => {
    trackPageView(location.pathname);
  }, [location, trackPageView]);

  return null;
}

function App() {
  return (
    <BrowserRouter>
      <RouteTracker />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="goals" element={<Goals />} />
          <Route path="calendar" element={<Calendar />} />
          <Route path="planner" element={<DailyPlanner />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;