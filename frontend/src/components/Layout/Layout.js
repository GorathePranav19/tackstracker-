import React from 'react';
import { useAuth } from '../../context/AuthContext';
import NotificationBell from '../Notifications/NotificationBell';
import { LogOut, Target } from 'lucide-react';

function Layout({ children }) {
    const { user, logout } = useAuth();

    return (
        <div className="app-layout">
            <header className="app-header">
                <div className="header-content">
                    <div className="header-left">
                        <div className="logo">
                            <Target size={28} />
                            <span>Team Goal Tracker</span>
                        </div>
                    </div>

                    <div className="header-right">
                        <NotificationBell />

                        <div className="user-menu">
                            <div className="user-info">
                                <span className="user-name">{user?.name}</span>
                                <span className="user-role">{user?.role}</span>
                            </div>
                            <button onClick={logout} className="btn btn-secondary btn-sm">
                                <LogOut size={16} />
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="app-main">
                {children}
            </main>
        </div>
    );
}

export default Layout;
