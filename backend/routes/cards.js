const router = require('express').Router();
const Card = require('../models/Card');
const { generateCardId } = require('../models/Card');
const Activity = require('../models/Activity');
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/auth');

// GET — todos los roles pueden ver
router.get('/', auth, async (req, res) => {
  try {
    const cards = await Card.find().sort({ createdAt: -1 });
    res.json(cards);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// POST — solo admin y agente
router.post('/', auth, requireRole('admin', 'agente'), async (req, res) => {
  try {
    const existing = await Card.findOne({ cedula: req.body.cedula });
    if (existing) {
      return res.status(400).json({ message: 'Ya existe una tarjeta vinculada a esta cédula' });
    }

    const issueDate = req.body.issueDate ? new Date(req.body.issueDate) : new Date();
    const expiryDate = new Date(issueDate);
    expiryDate.setFullYear(expiryDate.getFullYear() + 4);

    const card = new Card({
      ...req.body,
      cardId: generateCardId(),
      issueDate,
      expiryDate
    });

    await card.save();
    console.log('✅ CREADA:', card.cardId);
    
    await Activity.create({
      username: req.user.username,
      role: req.user.role,
      actionType: 'CREATE',
      details: `Creó la tarjeta: ${card.cardId}`
    }).catch(err => console.error('Error logging activity', err));

    res.json(card);
  } catch (e) {
    console.error('❌ ERROR POST:', e.message);
    res.status(400).json({ message: e.message });
  }
});

// PUT — solo admin y agente
router.put('/:id', auth, requireRole('admin', 'agente'), async (req, res) => {
  try {
    if (req.body.cedula) {
      const existing = await Card.findOne({ cedula: req.body.cedula });
      if (existing && existing._id.toString() !== req.params.id) {
        return res.status(400).json({ message: 'Ya existe otra tarjeta vinculada a esta cédula' });
      }
    }

    const card = await Card.findById(req.params.id);
    if (!card) return res.status(404).json({ message: 'No encontrada' });

    card.name        = req.body.name        ?? card.name;
    card.cedula      = req.body.cedula      ?? card.cedula;
    card.description = req.body.description ?? card.description;
    card.logo        = req.body.logo        ?? card.logo;

    if (req.body.issueDate) {
      card.issueDate = new Date(req.body.issueDate);
      const d = new Date(card.issueDate);
      d.setFullYear(d.getFullYear() + 4);
      card.expiryDate = d;
    }

    await card.save();
    console.log('✅ ACTUALIZADA:', card.cardId);

    await Activity.create({
      username: req.user.username,
      role: req.user.role,
      actionType: 'UPDATE',
      details: `Modificó la tarjeta: ${card.cardId}`
    }).catch(err => console.error('Error logging activity', err));

    res.json(card);
  } catch (e) {
    console.error('❌ ERROR PUT:', e.message);
    res.status(400).json({ message: e.message });
  }
});

// DELETE — solo admin
router.delete('/:id', auth, requireRole('admin'), async (req, res) => {
  try {
    const card = await Card.findById(req.params.id);
    if (!card) return res.status(404).json({ message: 'No encontrada' });
    
    await Card.findByIdAndDelete(req.params.id);
    
    await Activity.create({
      username: req.user.username,
      role: req.user.role,
      actionType: 'DELETE',
      details: `Eliminó permanentemente la tarjeta: ${card.cardId}`
    }).catch(err => console.error('Error logging activity', err));

    res.json({ message: 'Eliminado' });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;