import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import TranscriptionNotifications from './components/TranscriptionNotifications';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import VideoPlayer from './pages/VideoPlayer';
import FileManager from './pages/FileManager';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <>
                    <Dashboard />
                    <TranscriptionNotifications />
                  </>
                </ProtectedRoute>
              }
            />
            <Route
              path="/upload"
              element={
                <ProtectedRoute>
                  <>
                    <Upload />
                    <TranscriptionNotifications />
                  </>
                </ProtectedRoute>
              }
            />
            <Route
              path="/files"
              element={
                <ProtectedRoute>
                  <>
                    <FileManager />
                    <TranscriptionNotifications />
                  </>
                </ProtectedRoute>
              }
            />
            <Route
              path="/video/:id"
              element={
                <ProtectedRoute>
                  <>
                    <VideoPlayer />
                    <TranscriptionNotifications />
                  </>
                </ProtectedRoute>
              }
            />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

