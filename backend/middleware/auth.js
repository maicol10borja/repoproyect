// Este archivo se ejecuta ANTES de cada ruta protegida.
// Es como un guardia de seguridad:
// → Si tienes token válido: te deja pasar,  Si no tienes token: te bloquea con error 401


const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {

  // Busca el token en el header del request
  // El frontend lo manda así: "Authorization: Bearer eyJ..."
  const authHeader = req.headers['authorization'];
  console.log('AUTH HEADER:', authHeader);

  // Si no hay token → bloquear
  if (!authHeader) return res.status(401).json({ message: 'Sin token' });

  // Separa "Bearer" del token real
  const token = authHeader.split(' ')[1];

  try {
    // Verifica que el token sea válido y no esté vencido
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Guarda los datos del usuario (id, username) para usarlos en la ruta
    req.user = decoded;

    // Todo bien → deja pasar al siguiente paso
    next();
  } catch {
    // Token vencido o falso → bloquear
    res.status(401).json({ message: 'Token inválido' });
  }
};