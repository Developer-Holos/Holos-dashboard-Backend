const { Assistant, User, Prompt } = require('../models'); // Importar el modelo Prompt
const openaiService = require('../middleware/openaiService');  // Importar configuración de OpenAI
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

// Eliminar un archivo
const deleteVectorFile = async (req, res) => {
  const { fileId } = req.params; // Solo se necesita el fileId
  const userId = req.user.id; // Obtener el ID del usuario autenticado
  const user = await User.findByPk(userId);

  if (!user || !user.apiKey) {
    return res.status(403).json({ message: 'API key no encontrada para el usuario.' });
  }

  try {
    const openai = getOpenAIApiInstance(user.apiKey); // Instancia de OpenAI configurada
    console.log(`Eliminando archivo con ID: ${fileId}`);
    
    // Llamada a la API para eliminar el archivo
    const response = await openai.files.del(fileId);

    res.status(200).json({ message: 'Archivo eliminado exitosamente.', response });
  } catch (error) {
    console.error('Error al eliminar el archivo:', error);
    res.status(500).json({ message: 'Error al eliminar el archivo.' });
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

      const vectorStoreResponse = await openai.vectorStores.create({
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

const getFileDetails = async (req, res) => {
  const { fileId } = req.params; // Obtener el ID del archivo desde los parámetros de la ruta
  const userId = req.user.id; // Obtener el ID del usuario autenticado
  const user = await User.findByPk(userId);

  if (!user || !user.apiKey) {
    return res.status(403).json({ message: 'API key no encontrada para el usuario.' });
  }

  try {
    const openai = getOpenAIApiInstance(user.apiKey); // Instancia de OpenAI configurada
    console.log(`Obteniendo detalles del archivo con ID: ${fileId}`);
    const response = await openai.files.retrieve(fileId); // Llamada a la API de OpenAI para obtener detalles del archivo

    res.status(200).json(response); // Devolver los detalles del archivo al frontend
  } catch (error) {
    console.error('Error al obtener los detalles del archivo:', error.message);
    res.status(500).json({ message: 'Error al obtener los detalles del archivo.' });
  }
};

const path = require('path');
const XLSX = require('xlsx');
const axios = require('axios');

const updateAssistantFileWithDrive = async (req, res) => {
  const { assistantId } = req.params;
  const { driveFolderLink } = req.body; // Enlace público de la carpeta de Google Drive
  const userId = req.user.id;
  const user = await User.findByPk(userId);

  const supportedExtensions = [
    'c', 'cpp', 'cs', 'css', 'doc', 'docx', 'go', 'html', 'java', 'js', 'json', 'md', 'pdf', 'php', 'pptx', 'py', 'rb', 'sh', 'tex', 'ts', 'txt'
  ];

  const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

  if (!user || !user.apiKey) {
    return res.status(403).json({ message: 'API key no encontrada para el usuario.' });
  }

  if (!driveFolderLink) {
    return res.status(400).json({ message: 'Se requiere un enlace público de una carpeta de Google Drive.' });
  }

  try {
    const openai = getOpenAIApiInstance(user.apiKey);

    // Obtener el asistente actual
    const assistant = await Assistant.findByPk(assistantId);

    if (!assistant) {
      return res.status(404).json({ message: 'Asistente no encontrado.' });
    }

    // Si el asistente ya tiene un vectorStoreId, eliminar los archivos y el vector antiguo
    if (assistant.vectorStoreId) {
      console.log(`Eliminando archivos del vector store con ID: ${assistant.vectorStoreId}`);
      const filesResponse = await openai.vectorStores.files.list(assistant.vectorStoreId);
    
      if (filesResponse.data && filesResponse.data.length > 0) {
        for (const file of filesResponse.data) {
          console.log(`Eliminando archivo con ID: ${file.id}`);
          await openai.files.del(file.id); // Cambiado a openai.files.del
        }
      }

      console.log(`Eliminando vector store antiguo con ID: ${assistant.vectorStoreId}`);
      await openai.vectorStores.del(assistant.vectorStoreId);
    }

    // Extraer el ID de la carpeta desde el enlace público
    const folderId = extractFolderIdFromLink(driveFolderLink);
    if (!folderId) {
      return res.status(400).json({ message: 'No se pudo extraer el ID de la carpeta del enlace proporcionado.' });
    }

    // Listar los archivos en la carpeta pública
    const driveFiles = await listFilesInDriveFolder(folderId, GOOGLE_API_KEY);

    const fileIds = []; // Acumular los IDs de los archivos subidos

    for (const file of driveFiles) {
      console.log(`Descargando archivo desde Google Drive: ${file.name}`);

      // Descargar el archivo desde Google Drive
      let tempFilePath = await downloadFileFromDrive(file.id, file.name, GOOGLE_API_KEY);

      console.log(`Archivo descargado: ${tempFilePath}`);

      // Verificar la extensión del archivo
      const fileExtension = path.extname(tempFilePath).slice(1).toLowerCase();

      if (!supportedExtensions.includes(fileExtension)) {
        console.log(`La extensión .${fileExtension} no está permitida. Transformando a JSON...`);

        if (['xls', 'xlsx', 'xlsm'].includes(fileExtension)) {
          // Procesar archivo Excel y convertirlo a JSON
          const workbook = XLSX.readFile(tempFilePath);
          const jsonContent = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
          const jsonFilePath = `${tempFilePath}.json`;

          fs.writeFileSync(jsonFilePath, JSON.stringify(jsonContent));
          tempFilePath = jsonFilePath; // Actualizar la ruta del archivo para subir el JSON
        } else {
          // Transformar otros archivos no permitidos a JSON con contenido base64
          const fileContent = fs.readFileSync(tempFilePath);
          const base64Content = fileContent.toString('base64');
          const jsonContent = JSON.stringify({ content: base64Content });
          const jsonFilePath = `${tempFilePath}.json`;

          fs.writeFileSync(jsonFilePath, jsonContent);
          tempFilePath = jsonFilePath; // Actualizar la ruta del archivo para subir el JSON
        }
      }

      // Subir el archivo (ya sea original o transformado) a OpenAI
      const form = new FormData();
      form.append('file', fs.createReadStream(tempFilePath), path.basename(tempFilePath));
      form.append('purpose', 'assistants');

      const uploadResponse = await axios.post('https://api.openai.com/v1/files', form, {
        headers: {
          ...form.getHeaders(),
          'Authorization': `Bearer ${user.apiKey}`,
        },
      });

      const fileId = uploadResponse.data.id;
      fileIds.push(fileId); // Agregar el ID del archivo subido a la lista

      // Eliminar archivos temporales transformados
      if (tempFilePath.endsWith('.json')) {
        fs.unlinkSync(tempFilePath);
      }
    }

    // Crear un único vector store con todos los archivos subidos
    console.log(`Creando un único vector store con los archivos: ${fileIds.join(', ')}`);
    const vectorStoreResponse = await openai.vectorStores.create({
      file_ids: fileIds,
      name: `vector_${new Date().toLocaleDateString('es-ES').replace(/\//g, '-')}`,
    });

    const vectorStoreId = vectorStoreResponse.id;

    // Actualizar el vectorStoreId en la base de datos
    await Assistant.update(
      { vectorStoreId },
      { where: { id: assistantId } }
    );

    // Obtener el asistente actual desde OpenAI
    const existingAssistant = await openaiService.getAssistantById(user.apiKey, assistantId);
    console.log(`Asistente obtenido: ${existingAssistant.id}`);

    // Actualizar el asistente con los nuevos vector_store_ids
    const updatedData = {
      tool_resources: {
        file_search: {
          vector_store_ids: [vectorStoreId],
        },
      },
    };

    const response = await openaiService.updateAssistant(user.apiKey, assistantId, updatedData);
    console.log(`Asistente actualizado: ${response.id}`);

    res.status(200).json({ message: 'Archivos actualizados, vector store creado y asociado al asistente.', vectorStoreId });
  } catch (error) {
    console.error('Error al actualizar los archivos del asistente desde Google Drive:', error);
    res.status(500).json({ message: 'Error al actualizar los archivos del asistente desde Google Drive.' });
  }
};


// Función para extraer el ID de la carpeta desde el enlace público
const extractFolderIdFromLink = (link) => {
  const match = link.match(/[-\w]{25,}/);
  return match ? match[0] : null;
};

// Función para listar los archivos en una carpeta pública de Google Drive
const listFilesInDriveFolder = async (folderId, apiKey) => {
  const url = `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents&key=${apiKey}&fields=files(id,name)`;
  const response = await axios.get(url);
  return response.data.files;
};

// Función para descargar un archivo desde Google Drive
const downloadFileFromDrive = async (fileId, fileName, apiKey) => {
  const tempDir = path.join(__dirname, 'temp');
  
  // Verificar si el directorio 'temp' existe, si no, crearlo
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&key=${apiKey}`;
  const tempFilePath = path.join(tempDir, fileName);
  const writer = fs.createWriteStream(tempFilePath);

  const response = await axios.get(url, { responseType: 'stream' });
  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on('finish', () => resolve(tempFilePath));
    writer.on('error', reject);
  });
};

const downloadFileContent = async (req, res) => {
  const { fileId } = req.params; // Obtener el ID del archivo desde los parámetros de la ruta
  const userId = req.user.id; // Obtener el ID del usuario autenticado
  const user = await User.findByPk(userId);

  if (!user || !user.apiKey) {
    return res.status(403).json({ message: 'API key no encontrada para el usuario.' });
  }

  try {
    const openai = getOpenAIApiInstance(user.apiKey); // Instancia de OpenAI configurada
    console.log(`Descargando contenido del archivo con ID: ${fileId}`);
    const response = await openai.files.content(fileId); // Llamada a la API de OpenAI para obtener el contenido del archivo

    // Configurar la respuesta para descargar el archivo
    res.setHeader('Content-Disposition', `attachment; filename="${fileId}.txt"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.status(200).send(response); // Enviar el contenido del archivo al cliente
  } catch (error) {
    console.error('Error al descargar el contenido del archivo:', error.message);
    res.status(500).json({ message: 'Error al descargar el contenido del archivo.' });
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
  getFileDetails,
  updateAssistantFileWithDrive,
  downloadFileContent,
};