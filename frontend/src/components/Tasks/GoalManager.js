import React, { useState, useEffect } from 'react';
import { goalsAPI } from '../../services/api';
import { Plus, Edit2, Trash2, Target } from 'lucide-react';

function GoalManager({ onUpdate }) {
    const [goals, setGoals] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editingGoal, setEditingGoal] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        quarter: 1,
        year: new Date().getFullYear(),
        status: 'pending',
        progress: 0
    });

    useEffect(() => {
        fetchGoals();
    }, []);

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
            if (editingGoal) {
                await goalsAPI.update(editingGoal.id, formData);
            } else {
                await goalsAPI.create(formData);
            }

            fetchGoals();
            onUpdate?.();
            resetForm();
        } catch (error) {
            console.error('Error saving goal:', error);
            alert(error.response?.data?.error || 'Failed to save goal');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this goal?')) return;

        try {
            await goalsAPI.delete(id);
            fetchGoals();
            onUpdate?.();
        } catch (error) {
            console.error('Error deleting goal:', error);
        }
    };

    const handleEdit = (goal) => {
        setEditingGoal(goal);
        setFormData({
            title: goal.title,
            description: goal.description || '',
            quarter: goal.quarter,
            year: goal.year,
            status: goal.status,
            progress: goal.progress
        });
        setShowForm(true);
    };

    const resetForm = () => {
        setShowForm(false);
        setEditingGoal(null);
        setFormData({
            title: '',
            description: '',
            quarter: 1,
            year: new Date().getFullYear(),
            status: 'pending',
            progress: 0
        });
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': return '#10b981';
            case 'in_progress': return '#f59e0b';
            case 'cancelled': return '#ef4444';
            default: return '#6b7280';
        }
    };

    return (
        <div className="manager-container">
            <div className="manager-header">
                <h2><Target size={24} /> Quarterly Goals</h2>
                <button className="btn btn-primary" onClick={() => setShowForm(true)}>
                    <Plus size={18} /> New Goal
                </button>
            </div>

            {showForm && (
                <div className="modal-overlay" onClick={resetForm}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h3>{editingGoal ? 'Edit Goal' : 'Create New Goal'}</h3>
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

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Quarter *</label>
                                    <select
                                        value={formData.quarter}
                                        onChange={(e) => setFormData({ ...formData, quarter: parseInt(e.target.value) })}
                                        required
                                    >
                                        <option value="1">Q1 (Jan-Mar)</option>
                                        <option value="2">Q2 (Apr-Jun)</option>
                                        <option value="3">Q3 (Jul-Sep)</option>
                                        <option value="4">Q4 (Oct-Dec)</option>
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
                                    {editingGoal ? 'Update' : 'Create'} Goal
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="items-grid">
                {goals.length === 0 ? (
                    <div className="empty-state">
                        <Target size={48} />
                        <h3>No quarterly goals yet</h3>
                        <p>Create your first goal to get started</p>
                    </div>
                ) : (
                    goals.map((goal) => (
                        <div key={goal.id} className="item-card">
                            <div className="item-header">
                                <h3>{goal.title}</h3>
                                <div className="item-actions">
                                    <button onClick={() => handleEdit(goal)} className="icon-btn">
                                        <Edit2 size={16} />
                                    </button>
                                    <button onClick={() => handleDelete(goal.id)} className="icon-btn delete">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            {goal.description && <p className="item-description">{goal.description}</p>}

                            <div className="item-meta">
                                <span className="badge">Q{goal.quarter} {goal.year}</span>
                                <span
                                    className="badge"
                                    style={{ backgroundColor: getStatusColor(goal.status) }}
                                >
                                    {goal.status.replace('_', ' ')}
                                </span>
                            </div>

                            <div className="progress-section">
                                <div className="progress-bar">
                                    <div
                                        className="progress-fill"
                                        style={{ width: `${goal.progress}%` }}
                                    ></div>
                                </div>
                                <span className="progress-text">{goal.progress}%</span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

export default GoalManager;
