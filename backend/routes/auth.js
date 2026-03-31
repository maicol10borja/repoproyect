const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Activity = require('../models/Activity');

router.post('/register', async (req, res) => {
  try {
    const exists = await User.findOne({ username: req.body.username });
    if (exists) return res.status(400).json({ message: 'Usuario ya existe' });
    const hash = await bcrypt.hash(req.body.password, 10);
    const user = new User({
      username: req.body.username,
      password: hash,
      role: req.body.role || 'agente'
    });
    await user.save();
    res.json({ message: 'Usuario creado' });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.body.username });
    if (!user) return res.status(400).json({ message: 'Usuario no existe' });
    const valid = await bcrypt.compare(req.body.password, user.password);
    if (!valid) return res.status(400).json({ message: 'Contraseña incorrecta' });
    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    await Activity.create({
      username: user.username,
      role: user.role,
      actionType: 'LOGIN',
      details: 'Inició sesión en la plataforma'
    }).catch(err => console.error('Error logging activity:', err));

    res.json({ token, username: user.username, role: user.role });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;