import { Request, Response } from 'express';
import { configService } from '../services/config.service';

export const configController = {
  // Verificar si la API key de OpenAI está configurada
  async getOpenAIStatus(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ error: 'No autorizado' });
      }

      const configured = await configService.hasOpenAIKey(tenantId);
      res.json({ configured });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  // Guardar API key de OpenAI
  async setOpenAIKey(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ error: 'No autorizado' });
      }

      const { apiKey } = req.body;
      if (!apiKey || !apiKey.startsWith('sk-')) {
        return res.status(400).json({ error: 'API Key inválida. Debe comenzar con sk-' });
      }

      // Validar la key haciendo una llamada de prueba
      const isValid = await configService.validateOpenAIKey(apiKey);
      if (!isValid) {
        return res.status(400).json({ error: 'API Key inválida o sin créditos' });
      }

      await configService.setOpenAIKey(tenantId, apiKey);
      res.json({ success: true, message: 'API Key guardada correctamente' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  // Eliminar API key de OpenAI
  async deleteOpenAIKey(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ error: 'No autorizado' });
      }

      await configService.deleteOpenAIKey(tenantId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },
};
