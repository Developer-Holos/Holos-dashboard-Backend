const { Assistant, User, Prompt } = require('../models'); // Importar el modelo Prompt
const openaiService = require('../middleware/openaiService');  // Importar configuración de OpenAI
const openai = require('openai'); // Importar el módulo openai
const fs = require('fs'); // Importar el módulo fs
const getOpenAIApiInstance = require('../middleware/openai_config'); // Importar la configuración de OpenAI

// Obtener información de un asistente y compararla con la base de datos
const getAssistantData = async (req, res) => {
  try {
    const { assistantId } = req.params;  // Suponiendo que el ID de asistente viene por parámetro
    const userId = req.user.id; // Obtener el ID del usuario autenticado
    console.log(`Obteniendo usuario con id: ${userId}`);
    const user = await User.findByPk(userId);

    if (!user || !user.apiKey) {
      console.log('API key no encontrada para el usuario');
      return res.status(403).json({ message: 'API key no encontrada para el usuario.' });
    }

    console.log(`Realizando llamada a OpenAI para obtener datos del asistente con id: ${assistantId}`);
    const response = await openaiService.getAssistantById(user.apiKey, assistantId);

    console.log(`Obteniendo asistente de la base de datos con id: ${assistantId}`);
    const assistant = await Assistant.findByPk(assistantId);

    const vectorStoreId = response.tool_resources?.file_search?.vector_store_ids?.[0] || null; // Obtener vectorStoreId de la respuesta

    if (
      !assistant ||
      assistant.name !== response.name ||
      assistant.model !== response.model ||
      assistant.instructions !== response.instructions ||
      assistant.vectorStoreId !== vectorStoreId // Verificar si el vectorStoreId cambió
    ) {
      console.log('Actualizando asistente en la base de datos');
      await Assistant.upsert({
        id: response.id,
        name: response.name,
        model: response.model,
        instructions: response.instructions,
        userId: userId,
        vectorStoreId, // Guardar el vectorStoreId
      });

      if (response.instructions) {
        console.log('Obteniendo todos los prompts del asistente');
        const allPrompts = await Prompt.findAll({
          where: { assistantId: response.id },
        });

        const existingPrompt = allPrompts.find(prompt => prompt.content === response.instructions);

        if (!existingPrompt) {
          console.log('Las instrucciones son diferentes, creando un nuevo prompt');
          const version = (allPrompts.length > 0 ? Math.max(...allPrompts.map(prompt => prompt.version)) : 0) + 1;

          const lastPrompt = allPrompts.find(prompt => prompt.isActive);
          if (lastPrompt) {
            await lastPrompt.update({ isActive: false });
          }

          await Prompt.create({
            assistantId: response.id,
            content: response.instructions,
            name: `${response.name} Prompt v${version}`,
            version,
            isActive: true,
          });
        } else {
          console.log('Las instrucciones son iguales, activando el prompt existente');
          await existingPrompt.update({ isActive: true });
        }
      }
    } else {
      console.log('No hay cambios en el asistente, no se necesita actualizar');
    }

    console.log('Datos del asistente obtenidos y actualizados correctamente');
    res.status(200).json(response);
  } catch (error) {
    console.error('Error obteniendo los datos del asistente:', error);
    res.status(500).json({ message: 'Error al obtener los datos del asistente' });
  }
};

const getVectorFiles = async (req, res) => {
  const { vectorStoreId: paramVectorStoreId } = req.params;
  const userId = req.user.id;
  const user = await User.findByPk(userId);

  if (!user || !user.apiKey) {
    return res.status(403).json({ message: 'API key no encontrada para el usuario.' });
  }

  try {
    const assistant = await Assistant.findOne({ where: { userId } });
    const vectorStoreId = paramVectorStoreId || assistant?.vectorStoreId;

    if (!vectorStoreId) {
      return res.status(400).json({ message: 'No se encontró un vectorStoreId asociado.' });
    }

    const openai = getOpenAIApiInstance(user.apiKey);
    const response = await openai.vectorStores.files.list(vectorStoreId);

    res.status(200).json(response.data);
  } catch (error) {
    console.error('Error al obtener los archivos del vector store:', error.message);
    res.status(500).json({ message: 'Error al obtener los archivos del vector store.' });
  }
};

// Eliminar un archivo de un vector
const deleteVectorFile = async (req, res) => {
  const { vectorStoreId, fileId } = req.params;
  const userId = req.user.id; // Obtener el ID del usuario autenticado
  const user = await User.findByPk(userId);

  if (!user || !user.apiKey) {
    return res.status(403).json({ message: 'API key no encontrada para el usuario.' });
  }

  try {
    const openai = getOpenAIApiInstance(user.apiKey); // Instancia de OpenAI configurada
    console.log(`Eliminando archivo con ID: ${fileId} del vector store con ID: ${vectorStoreId}`);
    const response = await openai.vectorStores.files.del(vectorStoreId, fileId);

    res.status(200).json({ message: 'Archivo eliminado exitosamente.', response });
  } catch (error) {
    console.error('Error al eliminar el archivo del vector store:', error);
    res.status(500).json({ message: 'Error al eliminar el archivo del vector store.' });
  }
};

// Añadir un archivo a un vector existente
const addFileToVector = async (req, res) => {
  const { vectorStoreId } = req.params;
  const files = req.files; // Archivos subidos
  const userId = req.user.id; // Obtener el ID del usuario autenticado
  const user = await User.findByPk(userId);

  if (!user || !user.apiKey) {
    return res.status(403).json({ message: 'API key no encontrada para el usuario.' });
  }

  if (!files || files.length === 0) {
    return res.status(400).json({ message: 'Los archivos son obligatorios para añadir al vector.' });
  }

  try {
    const openai = getOpenAIApiInstance(user.apiKey); // Instancia de OpenAI configurada
    const fileIds = [];

    for (const file of files) {
      console.log(`Procesando archivo: ${file.originalname}`);

      const form = new FormData();
      form.append('file', fs.createReadStream(file.path), file.originalname);
      form.append('purpose', 'assistants');

      const response = await axios.post('https://api.openai.com/v1/files', form, {
        headers: {
          ...form.getHeaders(),
          'Authorization': `Bearer ${user.apiKey}`,
        },
      });

      const fileResponse = response.data;
      console.log(`Archivo subido, ID: ${fileResponse.id}`);
      fileIds.push(fileResponse.id);
    }

    console.log(`Añadiendo archivos al vector store con ID: ${vectorStoreId}`);
    const vectorStoreResponse = await openai.vectorStores.fileBatches.create(vectorStoreId, {
      file_ids: fileIds,
    });

    res.status(200).json(vectorStoreResponse);
  } catch (error) {
    console.error('Error al añadir archivos al vector store:', error);
    res.status(500).json({ message: 'Error al añadir archivos al vector store.' });
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
      await Assistant.upsert({
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

        // Verificar si las instrucciones son diferentes antes de crear un nuevo prompt
        if (!lastPrompt || lastPrompt.content !== assistantData.instructions) {
          const version = (lastPrompt?.version || 0) + 1;

          // Desactivar el último prompt activo
          if (lastPrompt) {
            await lastPrompt.update({ isActive: false });
          }

          await Prompt.create({
            assistantId: assistantData.id,
            content: assistantData.instructions,
            name: `${assistantData.name} Prompt v${version}`,
            version,
            isActive: true,
          });
        }
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
      // Verificar si las instrucciones son diferentes antes de actualizar
      console.log('Último prompt:', lastPrompt.content);
      console.log('Nuevas instrucciones:', instructions);
      if (lastPrompt.content !== instructions) {
        // Desactivar el último prompt activo
        await lastPrompt.update({ isActive: false });

        // Crear una nueva versión del prompt
        const newVersion = lastPrompt.version + 1;
        const newPrompt = await Prompt.create({
          assistantId,
          content: instructions,
          name: promptName || `${existingAssistant.name} Prompt v${newVersion}`,
          version: newVersion,
          isActive: true,
        });

        res.status(200).json({ assistant: response, prompt: newPrompt });
      } else {
        res.status(200).json({ assistant: response, prompt: lastPrompt });
      }
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

const axios = require('axios');
const FormData = require('form-data');

// Actualizar los archivos de un asistente (si el vector no existe)
const updateAssistantFile = async (req, res) => {
  const { assistantId } = req.params;
  const files = req.files;
  const userId = req.user.id;
  const user = await User.findByPk(userId);

  if (!user || !user.apiKey) {
    return res.status(403).json({ message: 'API key no encontrada para el usuario.' });
  }

  if (!files || files.length === 0) {
    return res.status(400).json({ message: 'Los archivos son obligatorios para actualizar el asistente.' });
  }

  try {
    const openai = getOpenAIApiInstance(user.apiKey);
    let vectorStoreId = null;

    for (const file of files) {
      const form = new FormData();
      form.append('file', fs.createReadStream(file.path), file.originalname);
      form.append('purpose', 'assistants');

      const response = await axios.post('https://api.openai.com/v1/files', form, {
        headers: {
          ...form.getHeaders(),
          'Authorization': `Bearer ${user.apiKey}`,
        },
      });

      const fileId = response.data.id;

      const vectorStoreResponse = await openai.beta.vectorStores.create({
        file_ids: [fileId],
        name: `vector_${new Date().toLocaleDateString('es-ES').replace(/\//g, '-')}`,
      });

      vectorStoreId = vectorStoreResponse.id;
    }

    // Actualizar el vectorStoreId en la base de datos
    await Assistant.update(
      { vectorStoreId },
      { where: { id: assistantId } }
    );

    res.status(200).json({ message: 'Archivos actualizados y vector store creado.', vectorStoreId });
  } catch (error) {
    console.error('Error al actualizar los archivos del asistente:', error);
    res.status(500).json({ message: 'Error al actualizar los archivos del asistente.' });
  }
};

module.exports = {
  getAssistantData,
  getVectorFiles,
  deleteVectorFile,
  addFileToVector,
  updateAssistantData,
  getUserAssistants,
  getAllAssistants,
  updateAssistantPrompt,
  updateAssistantFile,
};