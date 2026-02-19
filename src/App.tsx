import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LoginMock } from './components/pages/LoginMock';
import { AssessmentDemo } from './components/pages/AssessmentDemo';
import { AuthGuard } from './services/auth/AuthGuard';
import { HomeScreen } from './components/pages/HomeScreen';
import { UserProfile } from './components/pages/UserProfile';
import { CreateAccount } from './components/pages/CreateAccount';
import { ForgotPassword } from './components/pages/ForgotPassword';
import { PastAssessments } from './components/pages/PastAssessments';
import { PricingModels } from './components/pages/PricingModels';
import { AboutUs } from './components/pages/AboutUs';
import { CreateAssessment } from './components/pages/CreateAssessment';
import './App.css';

function Protected({ children }: { children: React.ReactNode }) {
  return <AuthGuard>{children}</AuthGuard>;
}

function App() {
  return (
    <div className="app">
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginMock />} />
        <Route path="/create-account" element={<CreateAccount />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Protected routes */}
        <Route path="/home" element={<Protected><HomeScreen /></Protected>} />
        <Route path="/assessment" element={<Protected><AssessmentDemo /></Protected>} />
        <Route path="/past-assessments" element={<Protected><PastAssessments /></Protected>} />
        <Route path="/create-assessment" element={<Protected><CreateAssessment /></Protected>} />
        <Route path="/profile" element={<Protected><UserProfile /></Protected>} />
        <Route path="/pricing" element={<Protected><PricingModels /></Protected>} />
        <Route path="/about" element={<Protected><AboutUs /></Protected>} />

        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </div>
  );
}

export default App;