const { Prompt } = require('../models');
const openaiService = require('../middleware/openai'); // Importar el servicio de OpenAI

exports.getPromptsByAssistant = async (req, res) => {
  const { assistantId } = req.params;
  try {
    const prompts = await Prompt.findAll({ where: { assistantId } });
    res.json(prompts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getPromptById = async (req, res) => {
  const { id } = req.params;
  try {
    const prompt = await Prompt.findByPk(id);
    if (!prompt) return res.status(404).json({ error: 'Prompt not found' });
    res.json(prompt);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createPrompt = async (req, res) => {
  const { assistantId } = req.params;
  const { content, name } = req.body;

  try {
    const lastPrompt = await Prompt.findOne({
      where: { assistantId },
      order: [['version', 'DESC']],
    });
    const version = (lastPrompt?.version || 0) + 1;

    // Desactivar cualquier otro prompt activo
    await Prompt.update({ isActive: false }, { where: { assistantId, isActive: true } });

    const prompt = await Prompt.create({ assistantId, version, content, name, isActive: false });

    // Enviar las instrucciones a OpenAI
    const user = req.user; // Obtener el usuario autenticado
    await openaiService.updateAssistant(user.apiKey, assistantId, { instructions: content });

    // Activar el nuevo prompt
    await prompt.update({ isActive: true });

    res.status(201).json(prompt);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updatePrompt = async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;

  try {
    const prompt = await Prompt.findByPk(id);
    if (!prompt) return res.status(404).json({ error: 'Prompt not found' });

    const newVersion = prompt.version + 1;

    // Desactivar cualquier otro prompt activo
    await Prompt.update({ isActive: false }, { where: { assistantId: prompt.assistantId, isActive: true } });

    const newPrompt = await Prompt.create({
      assistantId: prompt.assistantId,
      version: newVersion,
      content,
      name: prompt.name,
      isActive: false,
    });

    // Enviar las instrucciones a OpenAI
    const user = req.user; // Obtener el usuario autenticado
    await openaiService.updateAssistant(user.apiKey, prompt.assistantId, { instructions: content });

    // Activar el nuevo prompt
    await newPrompt.update({ isActive: true });

    res.status(201).json(newPrompt);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deletePrompt = async (req, res) => {
  const { id } = req.params;
  try {
    const prompt = await Prompt.findByPk(id);
    if (!prompt) return res.status(404).json({ error: 'Prompt not found' });

    await prompt.destroy();

    // Buscar el prompt más reciente y activarlo
    const latestPrompt = await Prompt.findOne({
      where: { assistantId: prompt.assistantId },
      order: [['version', 'DESC']],
    });

    if (latestPrompt) {
      // Enviar las instrucciones a OpenAI
      const user = req.user; // Obtener el usuario autenticado
      await openaiService.updateAssistant(user.apiKey, prompt.assistantId, { instructions: latestPrompt.content });

      // Activar el prompt más reciente
      await latestPrompt.update({ isActive: true });
    }

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.usePreviousVersion = async (req, res) => {
  const { id } = req.params;
  try {
    const prompt = await Prompt.findByPk(id);
    if (!prompt) return res.status(404).json({ error: 'Prompt not found' });

    // Desactivar cualquier otro prompt activo
    await Prompt.update({ isActive: false }, { where: { assistantId: prompt.assistantId, isActive: true } });

    // Enviar las instrucciones a OpenAI
    const user = req.user; // Obtener el usuario autenticado
    await openaiService.updateAssistant(user.apiKey, prompt.assistantId, { instructions: prompt.content });

    // Activar la versión anterior
    await prompt.update({ isActive: true });

    res.status(200).json(prompt);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};