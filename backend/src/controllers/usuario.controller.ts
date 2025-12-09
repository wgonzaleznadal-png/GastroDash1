import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { UsuarioService } from '../services/usuario.service';

const createUsuarioSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  apellido: z.string().min(2, 'El apellido debe tener al menos 2 caracteres'),
  rol: z.enum(['SUPER_ADMIN', 'ADMIN', 'GERENTE', 'CAJERO', 'MESERO', 'COCINERO', 'CADETE']),
  activo: z.boolean().optional(),
});

const updateUsuarioSchema = createUsuarioSchema.partial();

export class UsuarioController {
  constructor(private usuarioService: UsuarioService) {}

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;
      const validatedData = createUsuarioSchema.parse(req.body);
      
      const usuario = await this.usuarioService.createUsuario(tenantId, validatedData);
      
      res.status(201).json(usuario);
    } catch (error) {
      next(error);
    }
  }

  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;
      const { activo } = req.query;

      const usuarios = await this.usuarioService.getUsuarios(
        tenantId,
        activo === 'true' ? true : activo === 'false' ? false : undefined
      );
      
      res.json(usuarios);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;
      const { id } = req.params;

      const usuario = await this.usuarioService.getUsuarioById(tenantId, id);
      
      res.json(usuario);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;
      const { id } = req.params;
      const validatedData = updateUsuarioSchema.parse(req.body);

      const usuario = await this.usuarioService.updateUsuario(tenantId, id, validatedData);
      
      res.json(usuario);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;
      const { id } = req.params;

      await this.usuarioService.deleteUsuario(tenantId, id);
      
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}
