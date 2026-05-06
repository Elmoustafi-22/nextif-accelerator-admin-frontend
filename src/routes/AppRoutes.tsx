import { Routes, Route, Navigate, Outlet } from "react-router-dom";
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
import AdminDirectoryPage from "../pages/admins/AdminDirectoryPage";
import Layout from "../components/Layout";

// Placeholder components
const Unauthorized = () => (
  <div className="p-8 text-center text-red-500">
    <h2 className="text-2xl font-bold">Unauthorized Access</h2>
    <p className="mt-2">You don't have permission to view this page.</p>
  </div>
);

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
        </Route>
      </Route>

      {/* Catch-all */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default AppRoutes;
