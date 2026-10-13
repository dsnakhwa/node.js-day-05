import { AppError } from '../utils/AppError.js';
import {prisma} from '../config/prisma.js';
import { logger } from "../config/logger.js"

const statusMap = {
  todo: "TODO",
  "in-progress": "IN_PROGRESS",
  done: "DONE"
}

const priorityMap = {
  low: "LOW",
  medium: "MEDIUM",
  high: "HIGH"
}

function toApiTask(task) {
  if (!task) return task;

  return  {
    ...task,
    status: task.status.toLowerCase("_", "-"),
    priority: task.priority.toLowerCase(),
    createdAt: task.createdAt.toISOString(),
  }
}
export async function getAllTasks(options = {}) {

  const {
    status, 
    priority,
    sortBy = "createdAt",
    order = "desc",
    page = 1,
    limit = 10,
    userId
  } = options;

  const where  = {
    ...(userId !== undefined && { userId }),
    ...(status && {status: statusMap[status]}),
    ...(priority && {priority: priorityMap[priority]}),
  }

  const safeLimit = Math.min(100, Math.max(1, Number(limit) || 10))

  const [tasks, total] = await prisma.$transaction([
    prisma.task.findMany({
      where, 
      orderBy: { [sortBy] : order},
      skip: (page - 1) * safeLimit,
      take: safeLimit
    }),
    prisma.task.count({where}),
  ]);

  return {
    data: tasks.map(toApiTask),
    pagination: {
      page: page, 
      limit: safeLimit,
      total: total,
      totalPages: Math.ceil(total / safeLimit)
    }
  }
}

export async function getTaskByID(id, userId) {
  const task = await prisma.task.findFirst({
    where: {
      id: Number(id),
      ...(userId !== undefined && { userId})
    }
  })
  return toApiTask(task);
}

export async function addTask(data, userId) {
  try {

  const newTask = await prisma.task.create({
   data: {
    title: data.title,
    description: data.description,
    status: statusMap[data.status ?? "todo"],
    priority: priorityMap[data.priority ?? "low"],
    userId: userId
   },
  });

  return toApiTask(newTask);
} catch(err) {
  logger.info(err)
}
}

export async function updateTask(id, data, userId) {

  const where = {
    id: Number(id),
    ...addTask(userId !== undefined && { userId }),
  }
  const existing = await prisma.task.findFirst({where});

  if(!existing) return null;

  const task = await prisma.task.update({
    where: { id:existing.id},
    data: {
      ...(data.title !==  undefined && { title: data.title }),
      ...(data.description !==  undefined && { description: data.description }),
      ...(data.status !==  undefined && { status: statusMap[data.status] }),
      ...(data.priority !==  undefined && { title: priorityMap[data.priority] }),

    }
  })
  return toApiTask(tasks);
}

export async function deleteTask(id, userId) {
  const where = {
    id: Number(id),
    ...addTask(userId !== undefined && { userId }),
  }
  const existing = await prisma.task.findFirst({where});

  if(!existing) return null;

  await prisma.task.delete({
    where: {id: existing.id},
  })

  return true
}


export async function getAllTasksForAdmin() {
  const tasks = await prisma.task.findMany({
   orderBy: { createdAt: "desc"},
  });

  return tasks.map(toApiTask);
}