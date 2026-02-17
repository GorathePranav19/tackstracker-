const Joi = require('joi');

// Goal validation schema
const goalSchema = Joi.object({
    title: Joi.string().min(3).max(200).required().trim(),
    description: Joi.string().max(2000).allow('').trim(),
    quarter: Joi.number().integer().min(1).max(4).required(),
    year: Joi.number().integer().min(2020).max(2100).required(),
    status: Joi.string().valid('pending', 'in_progress', 'completed', 'cancelled'),
    progress: Joi.number().integer().min(0).max(100)
});

// Monthly plan validation schema
const planSchema = Joi.object({
    title: Joi.string().min(3).max(200).required().trim(),
    description: Joi.string().max(2000).allow('').trim(),
    month: Joi.number().integer().min(1).max(12).required(),
    year: Joi.number().integer().min(2020).max(2100).required(),
    quarterly_goal_id: Joi.number().integer().allow(null),
    status: Joi.string().valid('pending', 'in_progress', 'completed', 'cancelled'),
    progress: Joi.number().integer().min(0).max(100)
});

// Task validation schema
const taskSchema = Joi.object({
    title: Joi.string().min(3).max(200).required().trim(),
    description: Joi.string().max(2000).allow('').trim(),
    week_number: Joi.number().integer().min(1).max(53).required(),
    year: Joi.number().integer().min(2020).max(2100).required(),
    monthly_plan_id: Joi.number().integer().allow(null),
    priority: Joi.string().valid('low', 'medium', 'high'),
    status: Joi.string().valid('pending', 'in_progress', 'completed', 'cancelled'),
    estimated_hours: Joi.number().min(0).max(1000),
    actual_hours: Joi.number().min(0).max(1000),
    due_date: Joi.date().iso(),
    is_urgent: Joi.boolean(),
    depends_on: Joi.number().integer().allow(null)
});

// Time log validation schema
const timeLogSchema = Joi.object({
    task_id: Joi.number().integer().required(),
    hours: Joi.number().min(0.1).max(24).required(),
    date: Joi.date().iso().required(),
    notes: Joi.string().max(1000).allow('').trim()
});

// User registration validation schema
const registerSchema = Joi.object({
    name: Joi.string().min(2).max(100).required().trim(),
    email: Joi.string().email().required().trim().lowercase(),
    password: Joi.string().min(6).max(100).required(),
    role: Joi.string().valid('admin', 'manager', 'member')
});

// User login validation schema
const loginSchema = Joi.object({
    email: Joi.string().email().required().trim().lowercase(),
    password: Joi.string().required()
});

// Middleware function
const validate = (schema) => {
    return (req, res, next) => {
        const { error } = schema.validate(req.body, { abortEarly: false });
        if (error) {
            return res.status(400).json({
                error: 'Validation failed',
                details: error.details.map(d => d.message)
            });
        }
        next();
    };
};

module.exports = {
    goalSchema,
    planSchema,
    taskSchema,
    timeLogSchema,
    registerSchema,
    loginSchema,
    validate
};
