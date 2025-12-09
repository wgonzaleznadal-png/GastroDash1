import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🧪 Probando sistema de recetas...\n');

  // Obtener tenant
  const tenant = await prisma.tenant.findFirst();
  if (!tenant) {
    console.error('❌ No hay tenant');
    return;
  }

  // Obtener o crear categoría
  let categoria = await prisma.categoria.findFirst({
    where: { tenantId: tenant.id, nombre: 'Platos Principales' },
  });

  if (!categoria) {
    categoria = await prisma.categoria.create({
      data: {
        nombre: 'Platos Principales',
        activo: true,
        tenantId: tenant.id,
      },
    });
    console.log('✅ Categoría creada');
  }

  // Crear producto de prueba: Pizza Muzzarella
  const producto = await prisma.producto.create({
    data: {
      nombre: 'Pizza Muzzarella',
      descripcion: 'Pizza con queso muzzarella y aceitunas',
      categoriaId: categoria.id,
      precio: 0, // Se calculará con la receta
      costo: 0, // Se calculará con la receta
      stock: 0,
      stockMinimo: 0,
      disponible: true,
      tenantId: tenant.id,
    },
  });

  console.log(`✅ Producto creado: ${producto.nombre} (ID: ${producto.id})\n`);

  // Obtener ingredientes
  const harina = await prisma.ingrediente.findFirst({
    where: { nombre: 'Harina', tenantId: tenant.id },
  });

  const queso = await prisma.ingrediente.findFirst({
    where: { nombre: 'Queso Muzzarella', tenantId: tenant.id },
  });

  const salsa = await prisma.ingrediente.findFirst({
    where: { nombre: 'Salsa de Tomate', tenantId: tenant.id },
  });

  const aceitunas = await prisma.ingrediente.findFirst({
    where: { nombre: 'Aceitunas', tenantId: tenant.id },
  });

  if (!harina || !queso || !salsa || !aceitunas) {
    console.error('❌ Faltan ingredientes');
    return;
  }

  // Crear receta
  console.log('📝 Creando receta...\n');

  const recetas = [
    {
      productoId: producto.id,
      ingredienteId: harina.id,
      cantidad: 0.5, // 500g
      unidad: 'KILOGRAMO',
    },
    {
      productoId: producto.id,
      ingredienteId: queso.id,
      cantidad: 0.3, // 300g
      unidad: 'KILOGRAMO',
    },
    {
      productoId: producto.id,
      ingredienteId: salsa.id,
      cantidad: 200, // 200g
      unidad: 'GRAMO',
    },
    {
      productoId: producto.id,
      ingredienteId: aceitunas.id,
      cantidad: 100, // 100g
      unidad: 'GRAMO',
    },
  ];

  for (const receta of recetas) {
    await prisma.receta.create({ data: receta as any });
  }

  console.log('✅ Receta creada con 4 ingredientes\n');

  // Calcular costo
  const recetasConIngredientes = await prisma.receta.findMany({
    where: { productoId: producto.id },
    include: { ingrediente: true },
  });

  let costoTotal = 0;

  console.log('💰 Cálculo de costos:\n');
  console.log('Ingrediente          | Cantidad | Costo Unit. | Costo Total');
  console.log('---------------------|----------|-------------|------------');

  for (const receta of recetasConIngredientes) {
    const costoIngrediente = Number(receta.ingrediente.costo);
    const cantidad = Number(receta.cantidad);
    let costo = 0;

    // Conversión de unidades
    if (receta.unidad === 'GRAMO' && receta.ingrediente.unidad === 'KILOGRAMO') {
      costo = (costoIngrediente * cantidad) / 1000;
    } else if (receta.unidad === receta.ingrediente.unidad) {
      costo = costoIngrediente * cantidad;
    }

    costoTotal += costo;

    const nombrePadded = receta.ingrediente.nombre.padEnd(20);
    const cantidadStr = `${cantidad} ${receta.unidad}`.padEnd(10);
    const costoUnitStr = `$${costoIngrediente}`.padEnd(13);
    const costoTotalStr = `$${Math.round(costo)}`;

    console.log(`${nombrePadded}| ${cantidadStr}| ${costoUnitStr}| ${costoTotalStr}`);
  }

  console.log('---------------------|----------|-------------|------------');
  console.log(`${'TOTAL'.padEnd(20)}|          |             | $${Math.round(costoTotal)}\n`);

  // Actualizar costo del producto
  await prisma.producto.update({
    where: { id: producto.id },
    data: { costo: Math.round(costoTotal) },
  });

  console.log(`✅ Costo actualizado en el producto: $${Math.round(costoTotal)}\n`);

  // Calcular precio de venta
  const impuestos = costoTotal * 0.21; // 21%
  const beneficio = costoTotal * 0.40; // 40%
  const precioVenta = Math.round(costoTotal + impuestos + beneficio);

  await prisma.producto.update({
    where: { id: producto.id },
    data: { precio: precioVenta },
  });

  console.log('💵 Precio de venta:');
  console.log(`   Costo base:    $${Math.round(costoTotal)}`);
  console.log(`   Impuestos 21%: $${Math.round(impuestos)}`);
  console.log(`   Beneficio 40%: $${Math.round(beneficio)}`);
  console.log(`   ─────────────────────────────`);
  console.log(`   PRECIO FINAL:  $${precioVenta}\n`);

  console.log('🎉 ¡Prueba completada exitosamente!');
  console.log(`\n📋 Producto ID: ${producto.id}`);
  console.log(`   Puedes editar este producto en el frontend para ver la receta.`);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
