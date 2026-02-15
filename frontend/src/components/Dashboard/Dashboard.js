import React, { useState, useEffect } from 'react';
import { dashboardAPI } from '../../services/api';
import {
    Target,
    Calendar,
    CheckCircle,
    Clock,
    AlertCircle
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import TaskManager from '../Tasks/TaskManager';
import GoalManager from '../Tasks/GoalManager';
import PlanManager from '../Tasks/PlanManager';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b'];

function Dashboard() {
    const [stats, setStats] = useState(null);
    const [teamPerformance, setTeamPerformance] = useState([]);
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const [statsRes, teamRes] = await Promise.all([
                dashboardAPI.getStats(),
                dashboardAPI.getTeamPerformance()
            ]);

            setStats(statsRes.data);
            setTeamPerformance(teamRes.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Loading dashboard...</p>
            </div>
        );
    }

    const taskStatusData = [
        { name: 'Completed', value: stats?.completedTasks || 0 },
        { name: 'In Progress', value: stats?.inProgressTasks || 0 },
        { name: 'Pending', value: stats?.pendingTasks || 0 },
    ];

    return (
        <div className="dashboard">
            <div className="dashboard-header">
                <h1>Dashboard</h1>
                <p>Track your goals, plans, and tasks</p>
            </div>

            {/* Tab Navigation */}
            <div className="tab-navigation">
                <button
                    className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
                    onClick={() => setActiveTab('overview')}
                >
                    Overview
                </button>
                <button
                    className={`tab ${activeTab === 'goals' ? 'active' : ''}`}
                    onClick={() => setActiveTab('goals')}
                >
                    Quarterly Goals
                </button>
                <button
                    className={`tab ${activeTab === 'plans' ? 'active' : ''}`}
                    onClick={() => setActiveTab('plans')}
                >
                    Monthly Plans
                </button>
                <button
                    className={`tab ${activeTab === 'tasks' ? 'active' : ''}`}
                    onClick={() => setActiveTab('tasks')}
                >
                    Weekly Tasks
                </button>
                <button
                    className={`tab ${activeTab === 'team' ? 'active' : ''}`}
                    onClick={() => setActiveTab('team')}
                >
                    Team Performance
                </button>
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
                <div className="overview-content">
                    {/* Stats Cards */}
                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                                <Target size={24} />
                            </div>
                            <div className="stat-content">
                                <h3>{stats?.totalGoals || 0}</h3>
                                <p>Quarterly Goals</p>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
                                <Calendar size={24} />
                            </div>
                            <div className="stat-content">
                                <h3>{stats?.totalPlans || 0}</h3>
                                <p>Monthly Plans</p>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
                                <CheckCircle size={24} />
                            </div>
                            <div className="stat-content">
                                <h3>{stats?.completedTasks || 0}</h3>
                                <p>Completed Tasks</p>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}>
                                <Clock size={24} />
                            </div>
                            <div className="stat-content">
                                <h3>{stats?.totalHoursLogged?.toFixed(1) || 0}h</h3>
                                <p>Hours Logged</p>
                            </div>
                        </div>

                        {stats?.overdueTasksCount > 0 && (
                            <div className="stat-card alert">
                                <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' }}>
                                    <AlertCircle size={24} />
                                </div>
                                <div className="stat-content">
                                    <h3>{stats.overdueTasksCount}</h3>
                                    <p>Overdue Tasks</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Charts */}
                    <div className="charts-grid">
                        <div className="chart-card">
                            <h3>Task Status Distribution</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={taskStatusData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, value }) => `${name}: ${value}`}
                                        outerRadius={100}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {taskStatusData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="chart-card">
                            <h3>Team Performance</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={teamPerformance.slice(0, 6)}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="completed_tasks" fill="#6366f1" name="Completed" />
                                    <Bar dataKey="in_progress_tasks" fill="#8b5cf6" name="In Progress" />
                                    <Bar dataKey="pending_tasks" fill="#ec4899" name="Pending" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}

            {/* Goals Tab */}
            {activeTab === 'goals' && (
                <GoalManager onUpdate={fetchDashboardData} />
            )}

            {/* Plans Tab */}
            {activeTab === 'plans' && (
                <PlanManager onUpdate={fetchDashboardData} />
            )}

            {/* Tasks Tab */}
            {activeTab === 'tasks' && (
                <TaskManager onUpdate={fetchDashboardData} />
            )}

            {/* Team Performance Tab */}
            {activeTab === 'team' && (
                <div className="team-performance">
                    <h2>Team Performance Overview</h2>
                    <div className="team-grid">
                        {teamPerformance.map((member) => (
                            <div key={member.id} className="team-member-card">
                                <div className="member-header">
                                    <div className="member-avatar">
                                        {member.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="member-info">
                                        <h3>{member.name}</h3>
                                        <p>{member.email}</p>
                                    </div>
                                </div>
                                <div className="member-stats">
                                    <div className="member-stat">
                                        <span className="stat-label">Total Tasks</span>
                                        <span className="stat-value">{member.total_tasks}</span>
                                    </div>
                                    <div className="member-stat">
                                        <span className="stat-label">Completed</span>
                                        <span className="stat-value success">{member.completed_tasks}</span>
                                    </div>
                                    <div className="member-stat">
                                        <span className="stat-label">In Progress</span>
                                        <span className="stat-value warning">{member.in_progress_tasks}</span>
                                    </div>
                                    <div className="member-stat">
                                        <span className="stat-label">Hours Logged</span>
                                        <span className="stat-value">{member.total_hours?.toFixed(1) || 0}h</span>
                                    </div>
                                </div>
                                <div className="member-progress">
                                    <div className="progress-bar">
                                        <div
                                            className="progress-fill"
                                            style={{
                                                width: `${member.total_tasks > 0 ? (member.completed_tasks / member.total_tasks * 100) : 0}%`
                                            }}
                                        ></div>
                                    </div>
                                    <span className="progress-text">
                                        {member.total_tasks > 0 ? Math.round(member.completed_tasks / member.total_tasks * 100) : 0}% Complete
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default Dashboard;
