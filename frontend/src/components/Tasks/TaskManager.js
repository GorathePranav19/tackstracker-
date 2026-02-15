import React, { useState, useEffect } from 'react';
import { tasksAPI, plansAPI, timeLogsAPI } from '../../services/api';
import { Plus, Edit2, Trash2, CheckSquare, Clock, Link as LinkIcon } from 'lucide-react';
import { format } from 'date-fns';

function TaskManager({ onUpdate }) {
    const [tasks, setTasks] = useState([]);
    const [plans, setPlans] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [showTimeLog, setShowTimeLog] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [selectedTask, setSelectedTask] = useState(null);
    const [filterStatus, setFilterStatus] = useState('');
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        week_number: 1,
        year: new Date().getFullYear(),
        monthly_plan_id: '',
        priority: 'medium',
        status: 'pending',
        estimated_hours: 0,
        due_date: '',
        is_urgent: false,
        depends_on: ''
    });
    const [timeLogData, setTimeLogData] = useState({
        hours: 0,
        date: format(new Date(), 'yyyy-MM-dd'),
        notes: ''
    });

    useEffect(() => {
        fetchTasks();
        fetchPlans();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filterStatus]);

    const fetchTasks = async () => {
        try {
            const response = await tasksAPI.getAll(null, filterStatus);
            setTasks(response.data);
        } catch (error) {
            console.error('Error fetching tasks:', error);
        }
    };

    const fetchPlans = async () => {
        try {
            const response = await plansAPI.getAll();
            setPlans(response.data);
        } catch (error) {
            console.error('Error fetching plans:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const dataToSend = {
                ...formData,
                monthly_plan_id: formData.monthly_plan_id || null,
                depends_on: formData.depends_on || null,
                is_urgent: formData.is_urgent ? 1 : 0
            };

            if (editingTask) {
                await tasksAPI.update(editingTask.id, dataToSend);
            } else {
                await tasksAPI.create(dataToSend);
            }

            fetchTasks();
            onUpdate?.();
            resetForm();
        } catch (error) {
            console.error('Error saving task:', error);
            alert(error.response?.data?.error || 'Failed to save task');
        }
    };

    const handleTimeLogSubmit = async (e) => {
        e.preventDefault();

        try {
            await timeLogsAPI.create({
                task_id: selectedTask.id,
                ...timeLogData
            });

            fetchTasks();
            onUpdate?.();
            setShowTimeLog(false);
            setSelectedTask(null);
            setTimeLogData({
                hours: 0,
                date: format(new Date(), 'yyyy-MM-dd'),
                notes: ''
            });
        } catch (error) {
            console.error('Error logging time:', error);
            alert(error.response?.data?.error || 'Failed to log time');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this task?')) return;

        try {
            await tasksAPI.delete(id);
            fetchTasks();
            onUpdate?.();
        } catch (error) {
            console.error('Error deleting task:', error);
        }
    };

    const handleEdit = (task) => {
        setEditingTask(task);
        setFormData({
            title: task.title,
            description: task.description || '',
            week_number: task.week_number,
            year: task.year,
            monthly_plan_id: task.monthly_plan_id || '',
            priority: task.priority,
            status: task.status,
            estimated_hours: task.estimated_hours,
            due_date: task.due_date || '',
            is_urgent: task.is_urgent === 1,
            depends_on: task.depends_on || ''
        });
        setShowForm(true);
    };

    const openTimeLog = (task) => {
        setSelectedTask(task);
        setShowTimeLog(true);
    };

    const resetForm = () => {
        setShowForm(false);
        setEditingTask(null);
        setFormData({
            title: '',
            description: '',
            week_number: 1,
            year: new Date().getFullYear(),
            monthly_plan_id: '',
            priority: 'medium',
            status: 'pending',
            estimated_hours: 0,
            due_date: '',
            is_urgent: false,
            depends_on: ''
        });
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'high': return '#ef4444';
            case 'medium': return '#f59e0b';
            case 'low': return '#10b981';
            default: return '#6b7280';
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': return '#10b981';
            case 'in_progress': return '#f59e0b';
            case 'cancelled': return '#ef4444';
            default: return '#6b7280';
        }
    };

    const getPlanTitle = (planId) => {
        const plan = plans.find(p => p.id === planId);
        return plan ? plan.title : 'No linked plan';
    };

    const getTaskTitle = (taskId) => {
        const task = tasks.find(t => t.id === taskId);
        return task ? task.title : 'Unknown task';
    };

    const isOverdue = (dueDate, status) => {
        if (!dueDate || status === 'completed') return false;
        return new Date(dueDate) < new Date();
    };

    return (
        <div className="manager-container">
            <div className="manager-header">
                <h2><CheckSquare size={24} /> Weekly Tasks</h2>
                <div className="header-actions">
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="filter-select"
                    >
                        <option value="">All Tasks</option>
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                    <button className="btn btn-primary" onClick={() => setShowForm(true)}>
                        <Plus size={18} /> New Task
                    </button>
                </div>
            </div>

            {/* Task Form Modal */}
            {showForm && (
                <div className="modal-overlay" onClick={resetForm}>
                    <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
                        <h3>{editingTask ? 'Edit Task' : 'Create New Task'}</h3>
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
                                <label>Link to Monthly Plan (Optional)</label>
                                <select
                                    value={formData.monthly_plan_id}
                                    onChange={(e) => setFormData({ ...formData, monthly_plan_id: e.target.value })}
                                >
                                    <option value="">-- No linked plan --</option>
                                    {plans.map((plan) => (
                                        <option key={plan.id} value={plan.id}>
                                            {plan.title}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Week Number *</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="53"
                                        value={formData.week_number}
                                        onChange={(e) => setFormData({ ...formData, week_number: parseInt(e.target.value) })}
                                        required
                                    />
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

                                <div className="form-group">
                                    <label>Due Date</label>
                                    <input
                                        type="date"
                                        value={formData.due_date}
                                        onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Priority</label>
                                    <select
                                        value={formData.priority}
                                        onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                    </select>
                                </div>

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
                                    <label>Estimated Hours</label>
                                    <input
                                        type="number"
                                        step="0.5"
                                        min="0"
                                        value={formData.estimated_hours}
                                        onChange={(e) => setFormData({ ...formData, estimated_hours: parseFloat(e.target.value) })}
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Depends On (Task)</label>
                                    <select
                                        value={formData.depends_on}
                                        onChange={(e) => setFormData({ ...formData, depends_on: e.target.value })}
                                    >
                                        <option value="">-- No dependency --</option>
                                        {tasks.filter(t => !editingTask || t.id !== editingTask.id).map((task) => (
                                            <option key={task.id} value={task.id}>
                                                {task.title}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group checkbox-group">
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={formData.is_urgent}
                                            onChange={(e) => setFormData({ ...formData, is_urgent: e.target.checked })}
                                        />
                                        Mark as Urgent
                                    </label>
                                </div>
                            </div>

                            <div className="form-actions">
                                <button type="button" className="btn btn-secondary" onClick={resetForm}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    {editingTask ? 'Update' : 'Create'} Task
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Time Log Modal */}
            {showTimeLog && selectedTask && (
                <div className="modal-overlay" onClick={() => setShowTimeLog(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h3>Log Time for: {selectedTask.title}</h3>
                        <form onSubmit={handleTimeLogSubmit}>
                            <div className="form-group">
                                <label>Hours Spent *</label>
                                <input
                                    type="number"
                                    step="0.5"
                                    min="0.5"
                                    value={timeLogData.hours}
                                    onChange={(e) => setTimeLogData({ ...timeLogData, hours: parseFloat(e.target.value) })}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Date *</label>
                                <input
                                    type="date"
                                    value={timeLogData.date}
                                    onChange={(e) => setTimeLogData({ ...timeLogData, date: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Notes</label>
                                <textarea
                                    value={timeLogData.notes}
                                    onChange={(e) => setTimeLogData({ ...timeLogData, notes: e.target.value })}
                                    rows="3"
                                    placeholder="What did you work on?"
                                />
                            </div>

                            <div className="form-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowTimeLog(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    Log Time
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Tasks List */}
            <div className="tasks-list">
                {tasks.length === 0 ? (
                    <div className="empty-state">
                        <CheckSquare size={48} />
                        <h3>No tasks yet</h3>
                        <p>Create your first task to get started</p>
                    </div>
                ) : (
                    tasks.map((task) => (
                        <div
                            key={task.id}
                            className={`task-card ${task.is_urgent ? 'urgent' : ''} ${isOverdue(task.due_date, task.status) ? 'overdue' : ''}`}
                        >
                            <div className="task-header">
                                <div className="task-title-section">
                                    <h3>{task.title}</h3>
                                    {task.is_urgent && <span className="urgent-badge">⚡ URGENT</span>}
                                    {isOverdue(task.due_date, task.status) && <span className="overdue-badge">⚠️ OVERDUE</span>}
                                </div>
                                <div className="task-actions">
                                    <button onClick={() => openTimeLog(task)} className="icon-btn" title="Log time">
                                        <Clock size={16} />
                                    </button>
                                    <button onClick={() => handleEdit(task)} className="icon-btn">
                                        <Edit2 size={16} />
                                    </button>
                                    <button onClick={() => handleDelete(task.id)} className="icon-btn delete">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            {task.description && <p className="task-description">{task.description}</p>}

                            {task.monthly_plan_id && (
                                <p className="linked-item">
                                    📅 {getPlanTitle(task.monthly_plan_id)}
                                </p>
                            )}

                            {task.depends_on && (
                                <p className="linked-item dependency">
                                    <LinkIcon size={14} /> Depends on: {getTaskTitle(task.depends_on)}
                                </p>
                            )}

                            <div className="task-meta">
                                <span className="badge">Week {task.week_number}, {task.year}</span>
                                <span
                                    className="badge"
                                    style={{ backgroundColor: getPriorityColor(task.priority) }}
                                >
                                    {task.priority} priority
                                </span>
                                <span
                                    className="badge"
                                    style={{ backgroundColor: getStatusColor(task.status) }}
                                >
                                    {task.status.replace('_', ' ')}
                                </span>
                                {task.due_date && (
                                    <span className="badge">
                                        Due: {format(new Date(task.due_date), 'MMM dd, yyyy')}
                                    </span>
                                )}
                            </div>

                            <div className="task-time">
                                <div className="time-info">
                                    <Clock size={14} />
                                    <span>Estimated: {task.estimated_hours}h</span>
                                    <span>Actual: {task.actual_hours}h</span>
                                    {task.estimated_hours > 0 && (
                                        <span className={task.actual_hours > task.estimated_hours ? 'over-time' : 'on-time'}>
                                            ({task.actual_hours > task.estimated_hours ? '+' : ''}{(task.actual_hours - task.estimated_hours).toFixed(1)}h)
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

export default TaskManager;
