// AI service for frontend API calls

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class AIService {
    constructor() {
        this.isEnabled = process.env.REACT_APP_AI_ENABLED === 'true';
    }

    getAuthHeader() {
        const token = localStorage.getItem('token');
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };
    }

    async query(text) {
        if (!this.isEnabled) {
            return { error: 'AI features are not enabled' };
        }

        try {
            const response = await fetch(`${API_URL}/ai/query`, {
                method: 'POST',
                headers: this.getAuthHeader(),
                body: JSON.stringify({ query: text })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'AI query failed');
            }

            return await response.json();
        } catch (error) {
            console.error('AI query error:', error);
            return { error: error.message };
        }
    }

    async getSuggestions(context, params = {}) {
        try {
            const queryParams = new URLSearchParams({ context, ...params });
            const response = await fetch(`${API_URL}/ai/suggestions?${queryParams}`, {
                headers: this.getAuthHeader()
            });

            if (!response.ok) {
                throw new Error('Failed to get suggestions');
            }

            return await response.json();
        } catch (error) {
            console.error('Suggestions error:', error);
            return { error: error.message };
        }
    }

    async generateTasks(notes, goalId = null) {
        try {
            const response = await fetch(`${API_URL}/ai/generate-tasks`, {
                method: 'POST',
                headers: this.getAuthHeader(),
                body: JSON.stringify({ notes, goal_id: goalId })
            });

            if (!response.ok) {
                throw new Error('Failed to generate tasks');
            }

            return await response.json();
        } catch (error) {
            console.error('Task generation error:', error);
            return { error: error.message };
        }
    }

    async getInsights(period = 'week') {
        try {
            const response = await fetch(`${API_URL}/ai/insights?period=${period}`, {
                headers: this.getAuthHeader()
            });

            if (!response.ok) {
                throw new Error('Failed to get insights');
            }

            return await response.json();
        } catch (error) {
            console.error('Insights error:', error);
            return { error: error.message };
        }
    }

    async getRisks() {
        try {
            const response = await fetch(`${API_URL}/ai/risks`, {
                headers: this.getAuthHeader()
            });

            if (!response.ok) {
                throw new Error('Failed to get risks');
            }

            return await response.json();
        } catch (error) {
            console.error('Risks error:', error);
            return { error: error.message };
        }
    }

    async getPrediction(type, id) {
        try {
            const response = await fetch(`${API_URL}/ai/predictions/${type}/${id}`, {
                headers: this.getAuthHeader()
            });

            if (!response.ok) {
                throw new Error('Failed to get prediction');
            }

            return await response.json();
        } catch (error) {
            console.error('Prediction error:', error);
            return { error: error.message };
        }
    }
}

export default new AIService();
