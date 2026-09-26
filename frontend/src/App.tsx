import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { ConnectionProvider } from './context/ConnectionContext';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { ApplicationsPage } from './pages/ApplicationsPage';
import { CitizensPage } from './pages/CitizensPage';
import { DailyRojmelPage } from './pages/DailyRojmelPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 30, // 30 seconds
      retry: 1,
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ConnectionProvider>
          <AuthProvider>
            <ToastProvider>
            <BrowserRouter>
              <Routes>
                {/* Public Route */}
                <Route path="/login" element={<LoginPage />} />

                {/* Legacy HTML redirects for complete backwards compatibility */}
                <Route path="/pages/login.html" element={<Navigate to="/login" replace />} />
                <Route path="/pages/dashboard.html" element={<Navigate to="/dashboard" replace />} />
                <Route path="/pages/work.html" element={<Navigate to="/work" replace />} />
                <Route path="/pages/people.html" element={<Navigate to="/citizens" replace />} />
                <Route path="/pages/rojmel.html" element={<Navigate to="/rojmel" replace />} />
                <Route path="/pages/transactions.html" element={<Navigate to="/transactions" replace />} />
                <Route path="/pages/reports.html" element={<Navigate to="/reports" replace />} />
                <Route path="/pages/settings.html" element={<Navigate to="/settings" replace />} />
                <Route path="/index.html" element={<Navigate to="/dashboard" replace />} />

                {/* Protected Routes */}
                <Route path="/" element={<AppLayout />}>
                  <Route index element={<Navigate to="/dashboard" replace />} />
                  <Route path="dashboard" element={<DashboardPage />} />
                  <Route path="work" element={<ApplicationsPage />} />
                  <Route path="citizens" element={<CitizensPage />} />
                  <Route path="people" element={<Navigate to="/citizens" replace />} />
                  <Route path="rojmel" element={<DailyRojmelPage />} />
                  <Route path="transactions" element={<TransactionsPage />} />
                  <Route path="reports" element={<ReportsPage />} />
                  <Route path="settings" element={<SettingsPage />} />
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Route>
              </Routes>
            </BrowserRouter>
          </ToastProvider>
        </AuthProvider>
      </ConnectionProvider>
    </ThemeProvider>
  </QueryClientProvider>
);
};

export default App;
