import express from 'express'
import auth from '../middleware/auth.js';
import { 
    disconnectGoogleCalendar, 
    getGoogleConnectUrl, 
    handleGoogleCallback 
} from '../controllers/integrationController.js';

const integrationRouter = express.Router();

integrationRouter.get("/google/connect", auth, getGoogleConnectUrl);
integrationRouter.get("/google/callback", handleGoogleCallback);
integrationRouter.delete("/google/disconnect", auth, disconnectGoogleCalendar);

export default integrationRouter;