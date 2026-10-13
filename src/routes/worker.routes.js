import { Router } from "express";
import { runWorkerTask } from "../controller/worker.controller.js";


const workerRoutes = Router();

workerRoutes.post("/cpu", runWorkerTask);

export { workerRoutes }