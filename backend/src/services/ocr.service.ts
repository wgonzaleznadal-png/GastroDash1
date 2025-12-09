import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { configService } from './config.service';

interface OcrResult {
  proveedor?: string;
  fecha?: string;
  numeroComprobante?: string;
  tipoComprobante?: string;
  items: {
    descripcion: string;
    marca?: string;
    tipoArticulo?: 'INGREDIENTE' | 'PRODUCTO_DIRECTO' | 'INSUMO' | 'GASTO_SERVICIO';
    categoria?: string;
    cantidad: number;
    unidad: string;
    precioUnitario: number;
    precioTotal: number;
  }[];
  subtotal?: number;
  impuestos?: number;
  total?: number;
  rawText?: string;
}

class OcrService {
  async processImage(imagePath: string, tenantId?: string): Promise<OcrResult> {
    // Obtener API key del tenant o de las variables de entorno
    let apiKey: string | null = null;
    
    if (tenantId) {
      apiKey = await configService.getOpenAIKey(tenantId);
    }
    
    if (!apiKey) {
      apiKey = process.env.OPENAI_API_KEY || null;
    }
    
    if (!apiKey) {
      console.warn('OPENAI_API_KEY no configurada. OCR no disponible.');
      return {
        items: [],
        rawText: 'OCR no disponible. Configure la API Key de OpenAI en Configuración → Integraciones'
      };
    }
    
    const openai = new OpenAI({ apiKey });

    try {
      // Leer imagen y convertir a base64
      const imageBuffer = fs.readFileSync(imagePath);
      const base64Image = imageBuffer.toString('base64');
      const mimeType = this.getMimeType(imagePath);

      // Llamar a GPT-4 Vision
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `Eres un experto en extraer datos de facturas y comprobantes de compra para restaurantes argentinos.
Analiza la imagen y extrae la siguiente información en formato JSON:
{
  "proveedor": "nombre del proveedor/vendedor",
  "fecha": "YYYY-MM-DD",
  "numeroComprobante": "número de factura/ticket",
  "tipoComprobante": "FACTURA_A" | "FACTURA_B" | "FACTURA_C" | "TICKET" | "RECIBO" | "REMITO",
  "items": [
    {
      "descripcion": "nombre genérico del producto (sin marca)",
      "marca": "marca del producto si aplica",
      "tipoArticulo": "INGREDIENTE" | "PRODUCTO_DIRECTO" | "INSUMO" | "GASTO_SERVICIO",
      "categoria": "ALIMENTOS" | "BEBIDAS_ALCOHOLICAS" | "BEBIDAS_SIN_ALCOHOL" | "LIMPIEZA" | "DESCARTABLES" | "UTENSILIOS" | "SERVICIOS",
      "cantidad": número,
      "unidad": "KG" | "GRAMO" | "LITRO" | "MILILITRO" | "UNIDAD" | "DOCENA" | "CAJA" | "BANDEJA" | "PAQUETE" | "BOLSA" | "LATA" | "BOTELLA" | "SOBRE" | "MAPLE",
      "precioUnitario": número,
      "precioTotal": número
    }
  ],
  "subtotal": número,
  "impuestos": número (IVA u otros),
  "total": número
}

CLASIFICACIÓN DE TIPOS DE ARTÍCULO:
- INGREDIENTE: Materias primas para cocina (harina, carne, verduras, huevos, aceite). Categoría siempre ALIMENTOS.
- PRODUCTO_DIRECTO: Productos que se venden tal cual. Categoría según tipo:
  * Vinos, cervezas, licores, fernet → BEBIDAS_ALCOHOLICAS
  * Gaseosas, aguas, jugos → BEBIDAS_SIN_ALCOHOL
  * Merchandising, vasos reutilizables para venta → DESCARTABLES
- INSUMO: Productos de consumo interno. Categoría según tipo:
  * Detergente, lavandina, desengrasante → LIMPIEZA
  * Servilletas, bandejas, vasos descartables, bolsas, film → DESCARTABLES
  * Ollas, sartenes, cuchillos, tablas → UTENSILIOS
- GASTO_SERVICIO: Servicios sin stock (luz, gas, agua, alquiler). Categoría SERVICIOS.

REGLAS IMPORTANTES:
- Para INGREDIENTE: descripción genérica sin marca (ej: "Harina 000", "Carne molida")
- Para PRODUCTO_DIRECTO: separar nombre y marca (ej: descripcion="Gaseosa 2L", marca="Coca-Cola")
- Los precios deben ser números sin símbolos de moneda
- La fecha debe estar en formato YYYY-MM-DD
- Infiere la unidad basándote en el contexto
- Sé preciso con los números, especialmente decimales

FORMATO DE NÚMEROS ARGENTINOS (MUY IMPORTANTE):
- En Argentina se usa PUNTO como separador de miles y COMA como separador decimal
- Ejemplo: "$13.517,84" significa trece mil quinientos diecisiete con 84 centavos = 13517.84
- Ejemplo: "$2.981,72" significa dos mil novecientos ochenta y uno con 72 centavos = 2981.72
- Ejemplo: "$30.842,00" significa treinta mil ochocientos cuarenta y dos = 30842.00
- SIEMPRE convertir al formato numérico estándar (sin separador de miles, punto como decimal)
- Si ves "$431,43" es cuatrocientos treinta y uno con 43 centavos = 431.43

PROVEEDORES COMUNES EN ARGENTINA:
- Facturas de servicios: Aguas de Corrientes, DPEC, Edenor, Edesur, Metrogas, Naturgy, etc.
- Siempre extraer el nombre del proveedor de la factura`
          },
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${base64Image}`,
                  detail: 'high'
                }
              },
              {
                type: 'text',
                text: 'Extrae los datos de esta factura/comprobante en formato JSON.'
              }
            ]
          }
        ],
        max_tokens: 2000,
        temperature: 0.1
      });

      const content = response.choices[0]?.message?.content || '';
      
      // Extraer JSON de la respuesta
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          proveedor: parsed.proveedor,
          fecha: parsed.fecha,
          numeroComprobante: parsed.numeroComprobante,
          tipoComprobante: parsed.tipoComprobante,
          items: parsed.items || [],
          subtotal: parsed.subtotal,
          impuestos: parsed.impuestos,
          total: parsed.total,
          rawText: content
        };
      }

      return { items: [], rawText: content };
    } catch (error: any) {
      console.error('Error en OCR:', error);
      throw new Error(`Error procesando imagen: ${error.message}`);
    }
  }

  private getMimeType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.pdf': 'application/pdf'
    };
    return mimeTypes[ext] || 'image/jpeg';
  }
}

export const ocrService = new OcrService();
