import zod from "zod";

export const createTaskSchema = zod
  .object({
    title: zod.string().min(1),
    description: zod.string().min(1),
    status: zod.enum(["todo", "in-process", "done"]),
    priority: zod.enum(["low", "medium", "high"]),
  })
  .strict();

export const updateTaskSchema = zod
  .object({
    title: zod.string().min(1),
    description: zod.string().min(1),
    status: zod.enum(["todo", "in-process", "done"]),
    priority: zod.enum(["low", "medium", "high"]),
  })
  .strict();

export const taskQuerySchema = zod
  .object({
    status: zod.enum(["todo", "in-progess", "done"]).optional(),

    priority: zod
      .enum(["high", "medium", "low"])
      .default("low"),

    sortBy: zod
      .enum(["createdAt", "title", "priority", "status"])
      .default("createdAt"),

    order: zod.enum(["asc", "desc"]).default("asc"),

    page: zod.coerce.number().int().positive().default(1),

    limit: zod.coerce.number().int().positive().max(100).default(10),
  }).strict();
