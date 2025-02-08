const { Configuration, OpenAIApi } = require('openai');

const getOpenAIApiInstance = (apiKey) => {
  const configuration = new Configuration({
    apiKey: apiKey || process.env.OPENAI_API_KEY, // Usa la apiKey proporcionada o la de entorno
  });

  return new OpenAIApi(configuration);
};

module.exports = getOpenAIApiInstance;