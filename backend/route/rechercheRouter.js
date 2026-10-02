const express = require('express');
const { rechercher } = require('../controllers/rechercheController');
const rechercheRouter = express.Router();

rechercheRouter.get('/', rechercher);

module.exports = rechercheRouter;