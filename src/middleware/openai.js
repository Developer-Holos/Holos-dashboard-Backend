const axios = require("axios");
const FormData = require('form-data');
const fs = require('fs');

const openaiService = {
    listAssistants: async (apiKey, limit = 20, order = "desc") => {
        try {
            const response = await axios.get("https://api.openai.com/v1/assistants", {
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    'OpenAI-Beta': 'assistants=v2'
                },
                params: { limit, order },
            });
            return response.data;
        } catch (error) {
            console.error('Error en listAssistants:', error.response ? error.response.data : error.message);
            throw error;
        }
    },

    getAssistantById: async (apiKey, assistantId) => {
        try {
            const response = await axios.get(`https://api.openai.com/v1/assistants/${assistantId}`, {
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    'OpenAI-Beta': 'assistants=v2'
                },
            });
            return response.data;
        } catch (error) {
            console.error('Error en getAssistantById:', error.response ? error.response.data : error.message);
            throw error;
        }
    },

    updateAssistant: async (apiKey, assistantId, payload) => {
        try {
            const response = await axios.post(`https://api.openai.com/v1/assistants/${assistantId}`, payload, {
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    'OpenAI-Beta': 'assistants=v2',
                    "Content-Type": "application/json",
                },
            });
            return response.data;
        } catch (error) {
            console.error('Error en updateAssistant:', error.response ? error.response.data : error.message);
            if (error.response && error.response.data) {
                console.error('Detalles del error:', error.response.data);
            }
            throw error;
        }
    },

    createFile: async (apiKey, filePath) => {
        try {
            const form = new FormData();
            form.append('file', fs.createReadStream(filePath));
            form.append('purpose', 'assistants');

            const response = await axios.post('https://api.openai.com/v1/files', form, {
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    ...form.getHeaders(),
                },
            });
            return response.data;
        } catch (error) {
            console.error('Error en createFile:', error.response ? error.response.data : error.message);
            throw error;
        }
    },
};

module.exports = openaiService;