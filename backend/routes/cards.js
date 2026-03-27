const router = require('express').Router();
const Card = require('../models/Card');
const { generateCardId } = require('../models/Card');
const auth = require('../middleware/auth');

// GET todas
router.get('/', auth, async (req, res) => {
  try {
    const cards = await Card.find().sort({ createdAt: -1 });
    res.json(cards);
  } catch(e) {
    res.status(500).json({ message: e.message });
  }
});

// POST crear
router.post('/', auth, async (req, res) => {
  try {
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
    res.json(card);
  } catch(e) {
    console.error('❌ ERROR POST:', e.message);
    res.status(400).json({ message: e.message });
  }
});

// PUT actualizar
router.put('/:id', auth, async (req, res) => {
  try {
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
    res.json(card);
  } catch(e) {
    console.error('❌ ERROR PUT:', e.message);
    res.status(400).json({ message: e.message });
  }
});

// DELETE
router.delete('/:id', auth, async (req, res) => {
  try {
    await Card.findByIdAndDelete(req.params.id);
    res.json({ message: 'Eliminado' });
  } catch(e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;