import express from 'express';
import auth from '../middleware/auth.js';
import { listAvailability, saveAvailability } from '../controllers/availabilityController.js';

const availabilityRouter = express.Router();

availabilityRouter.get('/', auth, listAvailability);
availabilityRouter.get('/', auth, saveAvailability);

export default availabilityRouter;