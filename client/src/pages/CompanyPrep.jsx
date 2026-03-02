import React from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import { motion } from 'framer-motion'
import { Search, ExternalLink } from 'lucide-react'

const CompanyPrep = () => {
  const navigate = useNavigate();
  const companies = [
    { name: 'Google', color: '#4285F4', topics: ['Trees', 'Graphs', 'Dynamic Programming'] },
    { name: 'Amazon', color: '#FF9900', topics: ['System Design', 'Hashing', 'Heaps'] },
    { name: 'Microsoft', color: '#00A4EF', topics: ['Linked Lists', 'Arrays', 'Strings'] },
    { name: 'Meta', color: '#0668E1', topics: ['Recursion', 'Sorting', 'DP'] },
    { name: 'Netflix', color: '#E50914', topics: ['Networking', 'OS', 'DBMS'] },
    { name: 'Apple', color: '#555555', topics: ['Hardware', 'Low Level Design', 'Algorithms'] },
    { name: 'TCS', color: '#004C99', topics: ['Aptitude', 'Java', 'SQL'] },
  ];

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-content">
        <header className="dashboard-header">
          <h1>Company <span className="gradient-text">Preparation</span></h1>
          <p>Target specific companies with curated study materials and past interview questions.</p>
        </header>

        <div className="search-bar-container glass-card">
          <Search size={20} className="search-icon" />
          <input type="text" placeholder="Search for a company (e.g. Google, Amazon...)" className="company-search" />
        </div>

        <div className="companies-grid">
          {companies.map((company, i) => (
            <motion.div
              key={i}
              className="company-card glass-card"
              whileHover={{ scale: 1.02 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <div className="company-logo-placeholder" style={{ backgroundColor: company.color }}>
                {company.name[0]}
              </div>
              <div className="company-info">
                <h3>{company.name}</h3>
                <div className="topic-tags">
                  {company.topics.map((t, idx) => (
                    <span key={idx} className="topic-tag">{t}</span>
                  ))}
                </div>
              </div>
              <button
                className="prep-btn"
                onClick={() => navigate(`/company/${company.name}`)}
              >
                Start Prep <ExternalLink size={14} />
              </button>
            </motion.div>
          ))}
        </div>
      </main>

      <style dangerouslySetInnerHTML={{
        __html: `
        .search-bar-container {
          display: flex;
          align-items: center;
          padding: 1rem 1.5rem;
          margin-bottom: 3rem;
          gap: 1rem;
        }
        .company-search {
          flex: 1;
          background: none;
          border: none;
          color: white;
          font-size: 1.1rem;
          outline: none;
        }
        .companies-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 2rem;
        }
        .company-card {
          padding: 2rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 1.5rem;
        }
        .company-logo-placeholder {
          width: 70px;
          height: 70px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2rem;
          font-weight: 700;
          color: white;
          box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        }
        .topic-tags {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 0.5rem;
          margin-top: 1rem;
        }
        .topic-tag {
          font-size: 0.75rem;
          background: var(--glass);
          padding: 4px 10px;
          border-radius: 20px;
          border: 1px solid var(--glass-border);
        }
        .prep-btn {
          width: 100%;
          background: var(--primary);
          color: white;
          border-radius: 10px;
          padding: 0.8rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
        }
      `}} />
    </div>
  )
}

export default CompanyPrep
