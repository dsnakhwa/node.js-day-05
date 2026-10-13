import { cache } from "../config/cache.js";
import {
  addTask,
  deleteTask,
  getAllTasks,
  getAllTasksForAdmin,
  getTaskByID,
  updateTask,
} from "../database/store.js";
import { sendTaskCreateEmail } from "../utils/email.js";
import { logger } from "../config/logger.js"


export async function getTasks(req, res) {
  try {
    const result = await getAllTasks({ ...req.validated.query, userId: req.user.id });

    if (result.data.length === 0) {
      return res.status(404).json({
        status: 404,
        message: "No Tasks Found",
        result: {
          data: [],
          pagination: null,
        },
      });
    }

    return res
      .status(200)
      .json({ status: 200, message: "Tasks Fetch succesfully", result });
  } catch (err) {
    logger.info(err);
    return res
      .status(500)
      .json({ status: 500, message: "internal server error", error: err});
  }
}

export async function adminGetAllTasks(req, res) {
  try {
    const result = await getAllTasksForAdmin();

    if (result.length === 0) {
      return res.status(404).json({
        status: 404,
        message: "No Tasks Found",
        result: {
          data: [],
          pagination: null,
        },
      });
    }

    return res
      .status(200)
      .json({ status: 200, message: "Tasks Fetch succesfully", result });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ status: 500, message: "internal server error", error: err});
  }
}

export async function taskById(req, res) {
  try {
    const id = Number(req.params.id) || 0;
    const cacheKey = `task:${req.user.id}:${id}`;

    const cachedTask = cache.get(cacheKey);

    if (cachedTask !== undefined) {
      logger.info(`[CACHE] HIT ${cacheKey}`);

      return res.status(200).json({
        status: 200,
        message: "Task fetched successfully",
        data: cachedTask,
      });
    }

    logger.info(`[CACHE] MISS ${cacheKey}`);
    const result = await getTaskByID(id, req.user.id);


    if (!result) {
      return res
        .status(404)
        .json({ status: 404, message: "Task not Found", data: null });
    }

    cache.set(cacheKey, result);

    return res
      .status(200)
      .json({ status: 200, message: "Task Fetch succesfully", data: result });
  } catch (error) {
    return res
      .status(500)
      .json({ status: 500, message: "internal server error" }); 
  }
}

export async function newTask(req, res) {
  try {
    const task = req.validated.body;
    const result = await addTask(task, req.user.id);

    req.app.get("io").to(`user:${req.user.id}`).emit("task:created", {
      task : result
    });

    await sendTaskCreateEmail(result);

   return res
      .status(201)
      .json({ status: 201, message: "task added successfully", data: result });
  } catch (error) {
    return res
      .status(500)
      .json({ status: 500, message: "internal server error", err: error });
  }
}

export async function updatetaskById(req, res) {
  try {
    const id = Number(req.params.id) || 0;
    const task = req.validated.body;

    const result = await updateTask(id, task, req.user.id);

    if (!result) {
      return res
        .status(404)
        .json({ status: 404, message: "Task not Found", data: null });
    }

        req.app.get("io").to(`user:${req.user.id}`).emit("task:updated", {
      task : result
    })

    return res
      .status(200)
      .json({ status: 200, message: "Task updated succesfully", data: result });
  } catch (error) {
    return res
      .status(500)
      .json({ status: 500, message: "internal server error" });
  }
}

export async function deleteTaskById(req, res) {
  try {
    const id = Number(req.params.id, req.user.id) || 0;

    const cacheKey = `task:${req.user.id}:${id}`;
    const cachedTask = cache.get(cacheKey);

    if (cachedTask !== undefined) {
      cache.del(cacheKey);
    }

    const result = await deleteTask(id);
    logger.info();

    if (!result) {
      return res
        .status(404)
        .json({ status: 404, message: "Task not Found", data: null });
    }

    req.app.get("io").to(`user:${req.user.id}`).emit("task:deleted", {
      taskId : result
    });
    return res
      .status(200)
      .json({ status: 200, message: "Task deleted succesfully" });
  } catch (error) {
    return res
      .status(500)
      .json({ status: 500, message: "internal server error" });
  }
}
