import { Router } from "express";
import {
    createTaskSchema,
    taskQuerySchema,
    updateTaskSchema,
} from "../validators/task.validator.js";
import {
    getTasks,
    deleteTaskById,
    newTask,
    updatetaskById,
    taskById,
    adminGetAllTasks,
} from "../controller/task.controller.js";
import { validate } from '../middleware/validate.js'
import { authenicate, requireAdmin } from "../middleware/auth.js";

const taskRoutes = Router();

taskRoutes.use(authenicate);

taskRoutes.get("/", validate(taskQuerySchema, "query") , getTasks);
taskRoutes.get("/admin/all", requireAdmin, adminGetAllTasks);

taskRoutes.get("/:id", taskById);

taskRoutes.post("/", validate(createTaskSchema), newTask);

taskRoutes.put("/:id", validate(updateTaskSchema), updatetaskById);

taskRoutes.delete("/:id", deleteTaskById);

export { taskRoutes };
