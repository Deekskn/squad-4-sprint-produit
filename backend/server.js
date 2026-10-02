require('dotenv').config();

const express = require('express');
const cors = require('cors');
const pool = require('./config/database');
const path = require('path');
const app = express();
const rechercheRouter = require('./route/rechercheRouter');

app.use(cors());
app.use(express.json());
app.use('/api/recherche', rechercheRouter);
const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

pool.query('SELECT NOW()').then((result) => {
  console.log('Database connection successful');
}).catch((error) => {
  console.error('Error connecting to the database:', error);
});