// Ejecutar con: node cleanup.js
// Borra todas las tarjetas duplicadas, deja solo la más reciente de cada cédula

require('dotenv').config();
const mongoose = require('mongoose');

async function cleanup() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Conectado a MongoDB');

  const Card = require('./models/Card');
  const all = await Card.find().sort({ createdAt: 1 });
  console.log(`Total tarjetas: ${all.length}`);

  // Agrupar por cédula, quedarse con la última
  const seen = new Map();
  const toDelete = [];

  for (const card of all) {
    if (seen.has(card.cedula)) {
      toDelete.push(seen.get(card.cedula)._id); // borrar la anterior
    }
    seen.set(card.cedula, card);
  }

  if (toDelete.length > 0) {
    await Card.deleteMany({ _id: { $in: toDelete } });
    console.log(`✅ Eliminadas ${toDelete.length} tarjetas duplicadas`);
  } else {
    console.log('✅ No hay duplicados');
  }

  const remaining = await Card.countDocuments();
  console.log(`Tarjetas restantes: ${remaining}`);
  process.exit(0);
}

cleanup().catch(err => { console.error(err); process.exit(1); });