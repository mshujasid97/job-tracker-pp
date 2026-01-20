/**
 * Main App component with routing and authentication protection.
 * 
 * Handles:
 * - Application routing using React Router
 * - Authentication state management via AuthProvider
 * - Route protection for authenticated vs public routes
 * - Loading states during auth check
 * 
 * Route structure:
 * - / (root): Redirects to /login
 * - /login: Public route (redirects to /dashboard if already logged in)
 * - /register: Public route (redirects to /dashboard if already logged in)
 * - /dashboard: Protected route (redirects to /login if not authenticated)
 * 
 * Loading behavior:
 * - On app startup, AuthProvider checks if user is already logged in (from localStorage)
 * - While checking, protected/public routes show "Loading..." message
 * - Once auth status is determined, appropriate route is displayed
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Dashboard from './components/Dashboard/Dashboard';

/**
 * ProtectedRoute component: Restricts access to authenticated users only.
 * 
 * - If loading: Shows "Loading..." message
 * - If not authenticated: Redirects to /login
 * - If authenticated: Renders the protected component
 * 
 * Usage:
 *   <ProtectedRoute>
 *     <Dashboard />
 *   </ProtectedRoute>
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Component to render if authenticated
 */
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>;
  }

  // If not authenticated, redirect to login page
  return isAuthenticated ? children : <Navigate to="/login" />;
};

/**
 * PublicRoute component: Redirects authenticated users away.
 * 
 * Prevents logged-in users from seeing login/register pages unnecessarily.
 * 
 * - If loading: Shows "Loading..." message
 * - If authenticated: Redirects to /dashboard
 * - If not authenticated: Renders the public component
 * 
 * Usage:
 *   <PublicRoute>
 *     <Login />
 *   </PublicRoute>
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Component to render if not authenticated
 */
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>;
  }

  // If already authenticated, redirect to dashboard
  return isAuthenticated ? <Navigate to="/dashboard" /> : children;
};

/**
 * App: Main application component.
 * 
 * Sets up routing structure and wraps entire app with AuthProvider
 * to enable authentication state throughout the component tree.
 */
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Root path redirects to login */}
          <Route path="/" element={<Navigate to="/login" />} />
          
          {/* Public routes: Accessible only when not authenticated */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            }
          />
          
          {/* Protected routes: Accessible only when authenticated */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;