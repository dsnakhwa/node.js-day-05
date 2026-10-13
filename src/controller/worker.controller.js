import { runCpuTask } from "../utils/worker.util.js";

export async function runWorkerTask(req, res) {
    try {
        const iterations = Number(req.query.iterations ?? 5_000_000);

        if (!Number.isSafeInteger(iterations) || iterations < 1 || iterations > 50_000_000) {
            return res.status(400).json({
                status: 400,
                message: "iterations must be an integrer between 1 and 5000000"
            });
        }

        const startedAt = performance.now();
        const result = await runCpuTask(iterations);
        const durationMs = performance.now() - startedAt;

        return res.status(200).json({
            status:200,
            message: "Worker calcuation completed",
            data: {
                result,
                durationMs: Number(durationMs.toFixed(2)),
                iterations
            }
        });
    } catch (error) {
         console.error("[WORKER] Calculation failed:", error);

         return res.status(500).json({
            status: 500,
            message: "Worker calculation failed",
         })
    }
}