import React from 'react';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';
import ProtectedRoute from './ProtectedRoute';

const MainLayout = ({ children, roles }) => {
    return (
        <ProtectedRoute roles={roles}>
            <div className="dashboard-layout">
                <Sidebar />
                <main className="dashboard-content">
                    {children}
                </main>
            </div>
        </ProtectedRoute>
    );
};

export default MainLayout;
