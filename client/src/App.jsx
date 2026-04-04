import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import TestPage from './pages/TestPage'
import Results from './pages/Results'
import CompanyPrep from './pages/CompanyPrep'
import CompanyDetail from './pages/CompanyDetail'
import AdminDashboard from './pages/AdminDashboard'
import Leaderboard from './pages/Leaderboard'
import Compiler from './pages/Compiler'
import ResumeAnalyzer from './pages/ResumeAnalyzer'
import MockInterview from './pages/MockInterview'
import Forum from './pages/Forum'
import Settings from './pages/Settings'
import { AuthProvider } from './context/AuthContext'
import MainLayout from './components/MainLayout'
import './App.css'

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app-container">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected Student Routes */}
            <Route path="/dashboard" element={<MainLayout><Dashboard /></MainLayout>} />
            <Route path="/test/:id" element={<MainLayout><TestPage /></MainLayout>} />
            <Route path="/results" element={<MainLayout><Results /></MainLayout>} />
            <Route path="/company-prep" element={<MainLayout><CompanyPrep /></MainLayout>} />
            <Route path="/company/:name" element={<MainLayout><CompanyDetail /></MainLayout>} />
            <Route path="/leaderboard" element={<MainLayout><Leaderboard /></MainLayout>} />
            <Route path="/compiler" element={<MainLayout><Compiler /></MainLayout>} />
            <Route path="/resume-analyzer" element={<MainLayout><ResumeAnalyzer /></MainLayout>} />
            <Route path="/mock-interview" element={<MainLayout><MockInterview /></MainLayout>} />
            <Route path="/forum" element={<MainLayout><Forum /></MainLayout>} />
            <Route path="/settings" element={<MainLayout><Settings /></MainLayout>} />

            {/* Protected Admin Routes */}
            <Route path="/admin" element={
              <MainLayout roles={['admin']}>
                <AdminDashboard />
              </MainLayout>
            } />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App
