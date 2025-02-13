const openai = require('openai');

const getOpenAIApiInstance = (apiKey) => {
  const configuration = new openai.Configuration({
    apiKey: apiKey || process.env.OPENAI_API_KEY, // Usa la apiKey proporcionada o la de entorno
  });
  return new openai.OpenAIApi(configuration);
};

module.exports = getOpenAIApiInstance;