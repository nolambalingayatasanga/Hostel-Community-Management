import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { QueryClient, QueryClientProvider } from 'react-query';
import { SnackbarProvider } from 'notistack';
import theme from './theme';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';

// Layouts
import DashboardLayout from './layouts/DashboardLayout';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';

// Profile Pages
import Profile from './pages/profile/Profile';
import CompleteProfile from './pages/profile/CompleteProfile';

// Dashboard & Unified Directory
import Dashboard from './pages/dashboard/Dashboard';
import DirectoryList from './pages/directory/DirectoryList';
import EventList from './pages/events/EventList';
import EventDetail from './pages/events/EventDetail';
import Gallery from './pages/gallery/Gallery';

// Admin Page
import UserManagement from './pages/admin/UserManagement';
import AccessControl from './pages/access/AccessControl';
import NotFound from './pages/common/NotFound';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SnackbarProvider maxSnack={3} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <AuthProvider>
            <Router>
              <Routes>
                {/* Public Authentication Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password/:token" element={<ResetPassword />} />

                {/* Profile Completion - Protected but without dashboard layout */}
                <Route element={<ProtectedRoute />}>
                  <Route path="/complete-profile" element={<CompleteProfile />} />
                </Route>

                {/* Main Portal Routes - Protected and with sidebar layout */}
                <Route element={<ProtectedRoute />}>
                  <Route element={<DashboardLayout />}>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/profile/:id" element={<Profile />} />
                    
                    {/* Unified Directory Route */}
                    <Route path="/members" element={<DirectoryList />} />
                    
                    <Route path="/events" element={<EventList />} />
                    <Route path="/events/:id" element={<EventDetail />} />
                    <Route path="/gallery" element={<Gallery />} />
                    <Route path="/access-control" element={<AccessControl />} />
                  </Route>
                </Route>

                {/* Admin & Warden Routes */}
                <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'WARDEN']} />}>
                  <Route element={<DashboardLayout />}>
                    <Route path="/admin/users" element={<UserManagement />} />
                  </Route>
                </Route>

                {/* Redirects and 404 catch-all */}
                <Route path="/" element={<Navigate to="/profile" replace />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Router>
          </AuthProvider>
        </ThemeProvider>
      </SnackbarProvider>
    </QueryClientProvider>
  );
}

export default App;
