import { PrismaClient } from '@prisma/client';
import OpenAI from 'openai';

const prisma = new PrismaClient();

// Almacenamiento en memoria de las API keys por tenant (en producción usar Redis o DB encriptada)
const apiKeys: Map<string, string> = new Map();

class ConfigService {
  // Verificar si hay una API key configurada
  async hasOpenAIKey(tenantId: string): Promise<boolean> {
    // Primero revisar en memoria
    if (apiKeys.has(tenantId)) {
      return true;
    }
    
    // Luego revisar en la base de datos
    const config = await prisma.tenantConfig.findFirst({
      where: { tenantId, key: 'OPENAI_API_KEY' }
    });
    
    if (config) {
      // Cargar en memoria para uso futuro
      apiKeys.set(tenantId, config.value);
      return true;
    }
    
    return false;
  }

  // Obtener la API key
  async getOpenAIKey(tenantId: string): Promise<string | null> {
    // Primero revisar en memoria
    if (apiKeys.has(tenantId)) {
      return apiKeys.get(tenantId) || null;
    }
    
    // Luego revisar en la base de datos
    const config = await prisma.tenantConfig.findFirst({
      where: { tenantId, key: 'OPENAI_API_KEY' }
    });
    
    if (config) {
      apiKeys.set(tenantId, config.value);
      return config.value;
    }
    
    // Fallback a variable de entorno global
    return process.env.OPENAI_API_KEY || null;
  }

  // Validar una API key de OpenAI
  async validateOpenAIKey(apiKey: string): Promise<boolean> {
    try {
      const openai = new OpenAI({ apiKey });
      // Hacer una llamada simple para verificar
      await openai.models.list();
      return true;
    } catch (error) {
      console.error('Error validating OpenAI key:', error);
      return false;
    }
  }

  // Guardar API key
  async setOpenAIKey(tenantId: string, apiKey: string): Promise<void> {
    // Guardar en base de datos
    await prisma.tenantConfig.upsert({
      where: {
        tenantId_key: { tenantId, key: 'OPENAI_API_KEY' }
      },
      update: { value: apiKey },
      create: {
        tenantId,
        key: 'OPENAI_API_KEY',
        value: apiKey,
      }
    });
    
    // Guardar en memoria
    apiKeys.set(tenantId, apiKey);
  }

  // Eliminar API key
  async deleteOpenAIKey(tenantId: string): Promise<void> {
    await prisma.tenantConfig.deleteMany({
      where: { tenantId, key: 'OPENAI_API_KEY' }
    });
    
    apiKeys.delete(tenantId);
  }
}

export const configService = new ConfigService();
