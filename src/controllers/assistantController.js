const { Assistant, User, Prompt } = require('../models'); // Importar el modelo Prompt
const openaiService = require('../middleware/openai');  // Importar configuración de OpenAI
const openai = require('openai'); // Importar el módulo openai

// Obtener información de un asistente y compararla con la base de datos
const getAssistantData = async (req, res) => {
  try {
    const { assistantId } = req.params;  // Suponiendo que el ID de asistente viene por parámetro
    const userId = req.user.id; // Obtener el ID del usuario autenticado
    const user = await User.findByPk(userId);

    if (!user || !user.apiKey) {
      return res.status(403).json({ message: 'API key no encontrada para el usuario.' });
    }

    // Realizar la llamada a OpenAI para obtener los datos del asistente
    const response = await openaiService.getAssistantById(user.apiKey, assistantId);

    // Obtener el asistente de la base de datos
    const assistant = await Assistant.findByPk(assistantId);

    // Comparar y actualizar si hay cambios
    if (!assistant || assistant.name !== response.name || assistant.model !== response.model || assistant.instructions !== response.instructions) {
      await Assistant.upsert({
        id: response.id,
        name: response.name,
        model: response.model,
        instructions: response.instructions,
        userId: userId, // Asociar el asistente al usuario
      });

      // Guardar los prompts asociados al asistente
      if (response.instructions) {
        const lastPrompt = await Prompt.findOne({
          where: { assistantId: response.id },
          order: [['version', 'DESC']],
        });
        const version = (lastPrompt?.version || 0) + 1;

        await Prompt.create({
          assistantId: response.id,
          content: response.instructions,
          name: `${response.name} Prompt v${version}`,
          version,
          isActive: true,
        });
      }
    }

    res.status(200).json(response);
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
    const userId = req.user.id; // Obtener el ID del usuario autenticado
    const user = await User.findByPk(userId);

    if (!user || !user.apiKey) {
      return res.status(403).json({ message: 'API key no encontrada para el usuario.' });
    }

    // Llamada a OpenAI para actualizar datos
    const response = await openaiService.updateAssistant(user.apiKey, assistantId, newData);

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
  const userId = req.user.id; // Obtener el ID del usuario autenticado
  const user = await User.findByPk(userId);

  if (!user || !user.apiKey) {
    return res.status(403).json({ message: 'API key no encontrada para el usuario.' });
  }

  try {
    const response = await openaiService.listAssistants(user.apiKey, limit, order);
    // Verificar si response.data es un array
    if (!Array.isArray(response.data)) {
      throw new TypeError('La respuesta de OpenAI no es un array');
    }

    // Guardar los asistentes en la base de datos
    for (const assistantData of response.data) {
      const [assistant, created] = await Assistant.upsert({
        id: assistantData.id,
        name: assistantData.name,
        model: assistantData.model,
        instructions: assistantData.instructions,
        userId: userId, // Asociar el asistente al usuario
      });

      // Guardar los prompts asociados al asistente
      if (assistantData.instructions) {
        const lastPrompt = await Prompt.findOne({
          where: { assistantId: assistantData.id },
          order: [['version', 'DESC']],
        });
        const version = (lastPrompt?.version || 0) + 1;

        await Prompt.create({
          assistantId: assistantData.id,
          content: assistantData.instructions,
          name: `${assistantData.name} Prompt v${version}`,
          version,
          isActive: true,
        });
      }
    }

    res.status(200).json(response.data);
  } catch (error) {
    console.error('Error obteniendo los asistentes:', error);
    res.status(500).json({ message: 'Error al obtener los asistentes' });
  }
};

const updateAssistantPrompt = async (req, res) => {
  const { assistantId } = req.params;
  const { instructions, promptName } = req.body;
  const userId = req.user.id; // Obtener el ID del usuario autenticado
  const user = await User.findByPk(userId);

  if (!user || !user.apiKey) {
    return res.status(403).json({ message: 'API key no encontrada para el usuario.' });
  }

  if (!instructions) {
    return res.status(400).json({ message: 'El campo "instructions" es obligatorio.' });
  }

  try {
    // Obtener el asistente actual
    const existingAssistant = await openaiService.getAssistantById(user.apiKey, assistantId);

    // Solo enviar las instrucciones actualizadas
    const updatedData = { instructions };

    const response = await openaiService.updateAssistant(user.apiKey, assistantId, updatedData);

    // Obtener el último prompt activo
    const lastPrompt = await Prompt.findOne({
      where: { assistantId, isActive: true },
      order: [['version', 'DESC']],
    });

    if (lastPrompt) {
      // Actualizar el contenido del último prompt activo sin crear una nueva versión
      await lastPrompt.update({ content: instructions, name: promptName || lastPrompt.name });

      res.status(200).json({ assistant: response, prompt: lastPrompt });
    } else {
      // Crear el primer prompt si no existe ninguno
      const version = 1;
      const prompt = await Prompt.create({
        assistantId,
        content: instructions,
        name: promptName || `${existingAssistant.name} Prompt v${version}`,
        version,
        isActive: true,
      });

      res.status(200).json({ assistant: response, prompt });
    }
  } catch (error) {
    console.error('Error al actualizar el prompt del asistente:', error);
    res.status(500).json({ message: 'Error al actualizar el prompt del asistente.' });
  }
};

const updateAssistantFile = async (req, res) => {
  const { assistantId } = req.params;
  const { file } = req.body; // Archivo para subir (debe ser procesado como un `file` en el frontend)
  const userId = req.user.id; // Obtener el ID del usuario autenticado
  const user = await User.findByPk(userId);

  if (!user || !user.apiKey) {
    return res.status(403).json({ message: 'API key no encontrada para el usuario.' });
  }

  if (!file) {
    return res.status(400).json({ message: 'El archivo es obligatorio para actualizar el asistente.' });
  }

  try {
    // Subir el archivo a OpenAI y obtener el ID
    const fileResponse = await openaiService.createFile(user.apiKey, file);

    const fileId = fileResponse.id;

    // Obtener el asistente actual
    const existingAssistant = await openaiService.getAssistantById(user.apiKey, assistantId);

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

    const response = await openaiService.updateAssistant(user.apiKey, assistantId, updatedData);

    res.status(200).json(response);
  } catch (error) {
    console.error('Error al actualizar el archivo del asistente:', error);
    res.status(500).json({ message: 'Error al actualizar el archivo del asistente.' });
  } 
};

module.exports = {
  getAssistantData,
  updateAssistantData,
  getUserAssistants,
  getAllAssistants,
  updateAssistantPrompt,
  updateAssistantFile,
};