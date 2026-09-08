import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './App.css';
import { RTL_LANGUAGES } from './i18n';
import MainLayout from './layouts/MainLayout';
import AdminLayout from './layouts/AdminLayout';
import ProtectedRoute from './components/ProtectedRoute';

import Home from './pages/Home';
import About from './pages/About';
import Contact from './pages/Contact';
import NotFound from './pages/NotFound';
import Login from './pages/Login';
import Register from './pages/Register';

import CourseCatalog from './pages/CourseCatalog';
import CourseDetail from './pages/CourseDetail';
import LessonView from './pages/LessonView';
import CourseBuilder from './pages/CourseBuilder';
import FinalExam from './pages/FinalExam';
import Certificate from './pages/Certificate';
import VerifyCertificate from './pages/VerifyCertificate';

import LiveSessions from './pages/LiveSessions';
import InPersonSessions from './pages/InPersonSessions';
import SessionDetail from './pages/SessionDetail';
import SessionForm from './pages/SessionForm';

import Classrooms from './pages/Classrooms';
import ClassroomDetail from './pages/ClassroomDetail';

import MyLearning from './pages/MyLearning';
import TeachingHub from './pages/TeachingHub';

import AdminOverview from './pages/admin/AdminOverview';
import AdminCourses from './pages/admin/AdminCourses';
import AdminUsers from './pages/admin/AdminUsers';
import AdminUserDetail from './pages/admin/AdminUserDetail';
import AdminClassrooms from './pages/admin/AdminClassrooms';
import AdminClassroomBookings from './pages/admin/AdminClassroomBookings';
import AdminCoursePurchases from './pages/admin/AdminCoursePurchases';
import AdminInstructorApplications from './pages/admin/AdminInstructorApplications';
import AdminSessions from './pages/admin/AdminSessions';

function applyDirection(lang) {
  document.documentElement.dir = RTL_LANGUAGES.includes(lang) ? 'rtl' : 'ltr';
  document.documentElement.lang = lang;
}

function App() {
  const { i18n } = useTranslation();

  useEffect(() => {
    applyDirection(i18n.resolvedLanguage || i18n.language);
    i18n.on('languageChanged', applyDirection);
    return () => i18n.off('languageChanged', applyDirection);
  }, [i18n]);

  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/courses" element={<CourseCatalog />} />
        <Route path="/courses/:id" element={<CourseDetail />} />

        <Route path="/live-sessions" element={<LiveSessions />} />
        <Route path="/in-person-sessions" element={<InPersonSessions />} />
        <Route path="/sessions/:id" element={<SessionDetail />} />

        <Route path="/classrooms" element={<Classrooms />} />
        <Route path="/classrooms/:id" element={<ClassroomDetail />} />

        <Route path="/verify/:enrollmentId" element={<VerifyCertificate />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<MyLearning />} />
          <Route path="/courses/:courseId/lessons/:lessonId" element={<LessonView />} />
          <Route path="/courses/:courseId/final-exam" element={<FinalExam />} />
          <Route path="/courses/:courseId/certificate" element={<Certificate />} />
        </Route>

        <Route element={<ProtectedRoute roles={['instructor', 'admin']} />}>
          <Route path="/instructor" element={<TeachingHub />} />
          <Route path="/instructor/courses/new" element={<CourseBuilder />} />
          <Route path="/instructor/courses/:id/edit" element={<CourseBuilder />} />
          <Route path="/instructor/sessions/new" element={<SessionForm />} />
          <Route path="/instructor/sessions/:id/edit" element={<SessionForm />} />
        </Route>

        <Route element={<ProtectedRoute roles={['admin']} />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<AdminOverview />} />
            <Route path="/admin/courses" element={<AdminCourses />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/users/:id" element={<AdminUserDetail />} />
            <Route path="/admin/sessions" element={<AdminSessions />} />
            <Route path="/admin/classrooms" element={<AdminClassrooms />} />
            <Route path="/admin/classroom-bookings" element={<AdminClassroomBookings />} />
            <Route path="/admin/course-purchases" element={<AdminCoursePurchases />} />
            <Route path="/admin/instructor-applications" element={<AdminInstructorApplications />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

export default App;
