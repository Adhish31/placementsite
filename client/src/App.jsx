import React from 'react'
import Navbar from './components/Navbar'
import './App.css'

function App() {
  return (
    <div className="app-container">
      <Navbar />

      <main className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            Master Your <span className="gradient-text">Placements</span> <br />
            With Confidence
          </h1>
          <p className="hero-subtitle">
            The ultimate platform for mock tests, company-specific preparation,
            and real-time analytics to help you land your dream job.
          </p>
          <div className="hero-cta">
            <button className="primary-cta">Start Mock Test</button>
            <button className="secondary-cta">Explore Companies</button>
          </div>
        </div>

        <div className="hero-visual">
          <div className="orb orb-1"></div>
          <div className="orb orb-2"></div>
          <div className="visual-card glass-card">
            <div className="card-header">
              <span className="dot red"></span>
              <span className="dot yellow"></span>
              <span className="dot green"></span>
            </div>
            <div className="card-content">
              <h3>Next Challenge: Google Mock Test</h3>
              <p>45 Questions • 60 Minutes</p>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: '65%' }}></div>
              </div>
              <p className="small-text">65% Prepared for Google interview</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
