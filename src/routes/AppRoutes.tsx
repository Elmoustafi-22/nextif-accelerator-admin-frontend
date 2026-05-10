import { Routes, Route, Navigate, Outlet, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import ProtectedRoute from "../components/ProtectedRoute";

import LoginPage from "../pages/LoginPage";
import ResetPasswordPage from "../pages/ResetPasswordPage";
import AdminDashboard from "../pages/AdminDashboard";
import FellowsListPage from "../pages/FellowsListPage";
import BulkOnboardPage from "../pages/BulkOnboardPage";
import TaskManagementPage from "../pages/TaskManagementPage";
import ProfilePage from "../pages/ProfilePage";
import ComplaintsPage from "../pages/ComplaintsPage";
import AnnouncementsPage from "../pages/AnnouncementsPage";
import TaskSubmissionsPage from "../pages/TaskSubmissionsPage";
import EventListPage from "../pages/events/EventListPage";
import CreateEventPage from "../pages/events/CreateEventPage";
import EventAttendancePage from "../pages/events/EventAttendancePage";
import AttendanceManagementPage from "../pages/events/AttendanceManagementPage";
import AdminDirectoryPage from "../pages/admins/AdminDirectoryPage";
import LeaderboardPage from "../pages/LeaderboardPage";
import RecordingsPage from "../pages/RecordingsPage";
import Layout from "../components/Layout";

// Placeholder components
const Unauthorized = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/dashboard", { replace: true });
    }, 5000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#FDFDFD] p-8 text-center">
      <div className="bg-red-50 text-red-600 p-4 rounded-full mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
      </div>
      <h2 className="text-3xl font-black font-heading text-neutral-900 tracking-tight">Unauthorized Access</h2>
      <p className="mt-4 text-neutral-500 font-medium">You don't have permission to view this page.</p>
      <p className="mt-2 text-sm text-neutral-400 font-bold uppercase tracking-widest">Redirecting to your dashboard in 5 seconds...</p>
    </div>
  );
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Protected Routes - Admin Only */}
      <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        <Route element={<Layout children={<Outlet />} />}>
          <Route path="/dashboard" element={<AdminDashboard />} />
          <Route path="/fellows" element={<FellowsListPage />} />
          <Route path="/fellows/bulk" element={<BulkOnboardPage />} />
          <Route path="/tasks" element={<TaskManagementPage />} />
          <Route
            path="/tasks/:id/submissions"
            element={<TaskSubmissionsPage />}
          />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/team" element={<AdminDirectoryPage />} />
          <Route path="/complaints" element={<ComplaintsPage />} />
          <Route path="/announcements" element={<AnnouncementsPage />} />

          {/* Event Routes */}
          <Route path="/events" element={<EventListPage />} />
          <Route path="/events/create" element={<CreateEventPage />} />
          <Route path="/events/edit/:id" element={<CreateEventPage />} />
          <Route
            path="/events/:id/attendance"
            element={<EventAttendancePage />}
          />
          <Route path="/attendance" element={<AttendanceManagementPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/recordings" element={<RecordingsPage />} />
        </Route>
      </Route>

      {/* Catch-all */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default AppRoutes;
