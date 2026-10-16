import express from "express";
import auth from "../middleware/auth.js";
import {
  listServices,
  createService,
  updateService,
  deleteService,
} from "../controllers/serviceController.js";

const serviceRouter = express.Router();

serviceRouter.use(auth);

serviceRouter.get("/", listServices);
serviceRouter.post("/", createService);
serviceRouter.put("/:id", updateService);
serviceRouter.patch("/:id", updateService); 
serviceRouter.delete("/:id", deleteService);

export default serviceRouter;
