import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { QueryClient, QueryClientProvider } from 'react-query';
import { SnackbarProvider, useSnackbar } from 'notistack';
import { IconButton } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import theme from './theme';
import { AuthProvider } from './context/AuthContext';
import { PermissionProvider } from './context/PermissionContext';
import { UploadQueueProvider } from './context/UploadQueueContext';
import UploadManager from './components/common/UploadManager';
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
import DriveLinks from './pages/drive/DriveLinks';

// Admin Page
import UserManagement from './pages/admin/UserManagement';
import AccessControl from './pages/access/AccessControl';
import QrScanCount from './pages/qr/QrScanCount';
import QrRedirect from './pages/qr/QrRedirect';
import NotFound from './pages/common/NotFound';

const queryClient = new QueryClient();

function SnackbarCloseButton({ snackbarKey }) {
  const { closeSnackbar } = useSnackbar();

  return (
    <IconButton
      size="small"
      aria-label="close"
      color="inherit"
      onClick={() => closeSnackbar(snackbarKey)}
      sx={{
        p: 0.5,
        color: 'inherit',
        opacity: 0.85,
        '&:hover': {
          opacity: 1,
          backgroundColor: 'rgba(255, 255, 255, 0.2)',
        },
      }}
    >
      <CloseIcon fontSize="small" />
    </IconButton>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SnackbarProvider
        maxSnack={3}
        autoHideDuration={2000}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        action={(snackbarKey) => <SnackbarCloseButton snackbarKey={snackbarKey} />}
      >
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <AuthProvider>
            <PermissionProvider>
              <UploadQueueProvider>
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
                        <Route path="/drive-links" element={<DriveLinks />} />
                        <Route path="/access-control" element={<AccessControl />} />
                      </Route>
                    </Route>

                    {/* Admin & Warden Routes */}
                    <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'WARDEN']} />}>
                      <Route element={<DashboardLayout />}>
                        <Route path="/admin/users" element={<UserManagement />} />
                      </Route>
                    </Route>

                    {/* Admin Only Routes */}
                    <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
                      <Route element={<DashboardLayout />}>
                        <Route path="/qr-scan-count" element={<QrScanCount />} />
                      </Route>
                    </Route>

                    {/* Public QR tracking: domain/{code}?r=qr → count scan, then login */}
                    <Route path="/:code" element={<QrRedirect />} />

                    {/* Redirects and 404 catch-all */}
                    <Route path="/" element={<Navigate to="/profile" replace />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Router>
                <UploadManager />
              </UploadQueueProvider>
            </PermissionProvider>
          </AuthProvider>
        </ThemeProvider>
      </SnackbarProvider>
    </QueryClientProvider>
  );
}

export default App;
