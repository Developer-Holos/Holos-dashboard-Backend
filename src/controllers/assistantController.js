// filepath: /c:/Users/JOSE/Desktop/Proyetco-holos/src/controllers/assistantController.js
const { Assistant, User } = require('../models');
const openaiService = require('../middleware/openai');  // Importar configuración de OpenAI

// Obtener información de un asistente y guardarla en la base de datos
const getAssistantData = async (req, res) => {
  try {
    const { assistantId } = req.params;  // Suponiendo que el ID de asistente viene por parámetro

    // Realizar la llamada a OpenAI para obtener los datos del asistente
    const response = await openaiService.getAssistantById(assistantId);

    // Guardar los datos del asistente en la base de datos
    const [assistant, created] = await Assistant.upsert({
      id: response.id,
      name: response.name,
      description: response.description,
      model: response.model,
      instructions: response.instructions,
    });

    // Guardar los prompts asociados al asistente
    if (response.instructions) {
      const prompt = await Prompt.create({
        assistantId: response.id,
        content: response.instructions,
        name: `${response.name} Prompt`,
        version: 1,
        isActive: true
      });
      console.log('Prompt guardado en la base de datos:', prompt);
    }

    res.status(200).json(assistant);
  } catch (error) {
    console.error('Error obteniendo los datos del asistente:', error);
    res.status(500).json({ message: 'Error al obtener los datos del asistente' });
  }
};


// Actualizar los datos de un asistente
const updateAssistantData = async (req, res) => {
  try {
    const { assistantId } = req.params;
    const { newData } = req.body;  // Datos que deseas actualizar en el asistente

    // Llamada a OpenAI para actualizar datos
    const response = await openaiService.updateAssistant(assistantId, newData);

    // Actualizar los datos del asistente en la base de datos
    const assistant = await Assistant.update(newData, {
      where: { id: assistantId }
    });

    res.status(200).json(response);
  } catch (error) {
    console.error('Error actualizando los datos del asistente:', error);
    res.status(500).json({ message: 'Error al actualizar los datos del asistente' });
  }
};

// Asociar un asistente a un usuario
const associateAssistantToUser = async (req, res) => {
  const { userId, name, description } = req.body;

  try {
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const assistant = await Assistant.create({ userId, name, description });
    res.status(201).json(assistant);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Obtener todos los asistentes de un usuario
const getUserAssistants = async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findByPk(userId, {
      include: [Assistant],
    });

    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user.Assistants);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Obtener todos los asistentes
const getAllAssistants = async (req, res) => {
  const { limit = 20, order = 'desc' } = req.query;

  try {
    const response = await openaiService.listAssistants(limit, order);

    res.status(200).json(response);
  } catch (error) {
    console.error('Error obteniendo los asistentes:', error);
    res.status(500).json({ message: 'Error al obtener los asistentes' });
  }
};

// Actualizar el prompt de un asistente
const updateAssistantPrompt = async (req, res) => {
  const { assistantId } = req.params;
  const { instructions, promptName } = req.body; // Nuevo prompt y nombre opcional

  if (!instructions) {
    return res.status(400).json({ message: 'El campo "instructions" es obligatorio.' });
  }

  try {
    // Obtener el asistente actual
    const existingAssistant = await openaiService.getAssistantById(assistantId);

    // Actualizar solo el prompt
    const updatedData = {
      ...existingAssistant,
      instructions,
    };

    const response = await openaiService.updateAssistant(assistantId, updatedData);

    // Guardar el nuevo prompt en la base de datos
    const lastPrompt = await Prompt.findOne({
      where: { assistantId },
      order: [['version', 'DESC']],
    });
    const version = (lastPrompt?.version || 0) + 1;

    const prompt = await Prompt.create({
      assistantId,
      content: instructions,
      name: promptName || `${existingAssistant.name} Prompt v${version}`,
      version,
      isActive: true,
    });

    res.status(200).json({ assistant: response, prompt });
  } catch (error) {
    console.error('Error al actualizar el prompt del asistente:', error);
    res.status(500).json({ message: 'Error al actualizar el prompt del asistente.' });
  }
};

const updateAssistantFile = async (req, res) => {
  const { assistantId } = req.params;
  const { file } = req.body; // Archivo para subir (debe ser procesado como un `file` en el frontend)

  if (!file) {
    return res.status(400).json({ message: 'El archivo es obligatorio para actualizar el asistente.' });
  }

  try {
    // Subir el archivo a OpenAI y obtener el ID
    const fileResponse = await openai.files.create({
      file, // Debes enviar el archivo como un Stream
      purpose: 'assistants',
    });

    const fileId = fileResponse.id;

    // Obtener el asistente actual
    const existingAssistant = await openaiService.getAssistantById(assistantId);

    // Actualizar solo el `file_search` con el nuevo archivo
    const updatedData = {
      ...existingAssistant,
      tools: [
        {
          type: 'file_search',
          file_search: {
            file_ids: [fileId],
          },
        },
      ],
    };

    const response = await openaiService.updateAssistant(assistantId, updatedData);

    res.status(200).json(response);
  } catch (error) {
    console.error('Error al actualizar el archivo del asistente:', error);
    res.status(500).json({ message: 'Error al actualizar el archivo del asistente.' });
  }
};

module.exports = {
  getAssistantData,
  updateAssistantData,
  associateAssistantToUser,
  getUserAssistants,
  getAllAssistants,
  updateAssistantPrompt, // Nueva función para prompt
  updateAssistantFile, // Nueva función para archivos
};