import express from 'express'
import auth from '../middleware/auth.js';
import { createService, deleteService, listServices, updateService } from '../controllers/serviceController.js';

const serviceRouter = express.Router();

serviceRouter.get('/', auth, listServices);
serviceRouter.get('/', auth, createService);
serviceRouter.get('/:id', auth, updateService);
serviceRouter.get("/:id", auth, deleteService);


export default serviceRouter;