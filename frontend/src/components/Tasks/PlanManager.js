import React, { useState, useEffect } from 'react';
import { plansAPI, goalsAPI } from '../../services/api';
import { Plus, Edit2, Trash2, Calendar } from 'lucide-react';

function PlanManager({ onUpdate }) {
    const [plans, setPlans] = useState([]);
    const [goals, setGoals] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editingPlan, setEditingPlan] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        quarterly_goal_id: '',
        status: 'pending',
        progress: 0
    });

    useEffect(() => {
        fetchPlans();
        fetchGoals();
    }, []);

    const fetchPlans = async () => {
        try {
            const response = await plansAPI.getAll();
            setPlans(response.data);
        } catch (error) {
            console.error('Error fetching plans:', error);
        }
    };

    const fetchGoals = async () => {
        try {
            const response = await goalsAPI.getAll();
            setGoals(response.data);
        } catch (error) {
            console.error('Error fetching goals:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const dataToSend = {
                ...formData,
                quarterly_goal_id: formData.quarterly_goal_id || null
            };

            if (editingPlan) {
                await plansAPI.update(editingPlan.id, dataToSend);
            } else {
                await plansAPI.create(dataToSend);
            }

            fetchPlans();
            onUpdate?.();
            resetForm();
        } catch (error) {
            console.error('Error saving plan:', error);
            alert(error.response?.data?.error || 'Failed to save plan');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this plan?')) return;

        try {
            await plansAPI.delete(id);
            fetchPlans();
            onUpdate?.();
        } catch (error) {
            console.error('Error deleting plan:', error);
        }
    };

    const handleEdit = (plan) => {
        setEditingPlan(plan);
        setFormData({
            title: plan.title,
            description: plan.description || '',
            month: plan.month,
            year: plan.year,
            quarterly_goal_id: plan.quarterly_goal_id || '',
            status: plan.status,
            progress: plan.progress
        });
        setShowForm(true);
    };

    const resetForm = () => {
        setShowForm(false);
        setEditingPlan(null);
        setFormData({
            title: '',
            description: '',
            month: new Date().getMonth() + 1,
            year: new Date().getFullYear(),
            quarterly_goal_id: '',
            status: 'pending',
            progress: 0
        });
    };

    const getMonthName = (month) => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return months[month - 1];
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': return '#10b981';
            case 'in_progress': return '#f59e0b';
            case 'cancelled': return '#ef4444';
            default: return '#6b7280';
        }
    };

    const getGoalTitle = (goalId) => {
        const goal = goals.find(g => g.id === goalId);
        return goal ? goal.title : 'No linked goal';
    };

    return (
        <div className="manager-container">
            <div className="manager-header">
                <h2><Calendar size={24} /> Monthly Plans</h2>
                <button className="btn btn-primary" onClick={() => setShowForm(true)}>
                    <Plus size={18} /> New Plan
                </button>
            </div>

            {showForm && (
                <div className="modal-overlay" onClick={resetForm}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h3>{editingPlan ? 'Edit Plan' : 'Create New Plan'}</h3>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Title *</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows="3"
                                />
                            </div>

                            <div className="form-group">
                                <label>Link to Quarterly Goal (Optional)</label>
                                <select
                                    value={formData.quarterly_goal_id}
                                    onChange={(e) => setFormData({ ...formData, quarterly_goal_id: e.target.value })}
                                >
                                    <option value="">-- No linked goal --</option>
                                    {goals.map((goal) => (
                                        <option key={goal.id} value={goal.id}>
                                            {goal.title} (Q{goal.quarter} {goal.year})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Month *</label>
                                    <select
                                        value={formData.month}
                                        onChange={(e) => setFormData({ ...formData, month: parseInt(e.target.value) })}
                                        required
                                    >
                                        {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                                            <option key={month} value={month}>
                                                {getMonthName(month)}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Year *</label>
                                    <input
                                        type="number"
                                        value={formData.year}
                                        onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Status</label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="in_progress">In Progress</option>
                                        <option value="completed">Completed</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Progress (%)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={formData.progress}
                                        onChange={(e) => setFormData({ ...formData, progress: parseInt(e.target.value) })}
                                    />
                                </div>
                            </div>

                            <div className="form-actions">
                                <button type="button" className="btn btn-secondary" onClick={resetForm}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    {editingPlan ? 'Update' : 'Create'} Plan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="items-grid">
                {plans.length === 0 ? (
                    <div className="empty-state">
                        <Calendar size={48} />
                        <h3>No monthly plans yet</h3>
                        <p>Create your first plan to get started</p>
                    </div>
                ) : (
                    plans.map((plan) => (
                        <div key={plan.id} className="item-card">
                            <div className="item-header">
                                <h3>{plan.title}</h3>
                                <div className="item-actions">
                                    <button onClick={() => handleEdit(plan)} className="icon-btn">
                                        <Edit2 size={16} />
                                    </button>
                                    <button onClick={() => handleDelete(plan.id)} className="icon-btn delete">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            {plan.description && <p className="item-description">{plan.description}</p>}

                            {plan.quarterly_goal_id && (
                                <p className="linked-goal">
                                    🎯 {getGoalTitle(plan.quarterly_goal_id)}
                                </p>
                            )}

                            <div className="item-meta">
                                <span className="badge">{getMonthName(plan.month)} {plan.year}</span>
                                <span
                                    className="badge"
                                    style={{ backgroundColor: getStatusColor(plan.status) }}
                                >
                                    {plan.status.replace('_', ' ')}
                                </span>
                            </div>

                            <div className="progress-section">
                                <div className="progress-bar">
                                    <div
                                        className="progress-fill"
                                        style={{ width: `${plan.progress}%` }}
                                    ></div>
                                </div>
                                <span className="progress-text">{plan.progress}%</span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

export default PlanManager;
