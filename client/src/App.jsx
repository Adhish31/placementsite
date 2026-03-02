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
import Forum from './pages/Forum'
import { AuthProvider } from './context/AuthContext'
import './App.css'

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app-container">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/test/:id" element={<TestPage />} />
            <Route path="/results" element={<Results />} />
            <Route path="/company-prep" element={<CompanyPrep />} />
            <Route path="/company/:name" element={<CompanyDetail />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/compiler" element={<Compiler />} />
            <Route path="/resume-analyzer" element={<ResumeAnalyzer />} />
            <Route path="/forum" element={<Forum />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App
