//Arranca MDV

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
if (process.env.NODE_ENV !== 'production') require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/cards', require('./routes/cards'));
app.use('/api/activity', require('./routes/activity'));

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Mongo conectado'))
  .catch(err => console.log(err));

app.listen(process.env.PORT || 3000, () => {
  console.log('Servidor en puerto 3000');
});