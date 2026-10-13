import express from 'express';
import adminAuth from '../middleware/adminAuth.js';
import { getAdminDashboard, loginAdmin, updateWithdrawalStatus } from '../controllers/adminController.js';

const adminRouter = express.Router();

adminRouter.post("/login", loginAdmin);
adminRouter.get("/dashboard", adminAuth, getAdminDashboard);
adminRouter.patch("/withdrawals/:id", adminAuth, updateWithdrawalStatus);

export default adminRouter;