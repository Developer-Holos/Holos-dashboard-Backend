const { OpenAIApi } = require('openai');

const getOpenAIApiInstance = (apiKey) => {
  return new OpenAIApi({
    apiKey: apiKey || process.env.OPENAI_API_KEY, // Usa la apiKey proporcionada o la de entorno
  });
};

module.exports = getOpenAIApiInstance;