import { fileURLToPath } from "node:url";
import { Worker } from "node:worker_threads";

const workerPath = fileURLToPath(
    new URL("../worker/cpu.worker.js", import.meta.url)
);

export function runCpuTask(iterations) {
    return new Promise((resolve, reject) => {
        const worker = new Worker(workerPath, {
            workerData: { iterations },
        });

        let setled = false;

        function finish(error, result) {
            if (setled) return;
            setled = true;

            if(error) {
                reject(error);
            } else {
                resolve(result);
            }
        }

        worker.once("message", (message) => {
            if (!message.success) {
                finish(new Error(message.error));
                return;
            }

            finish(null, message.result);
        });

        worker.once("error", (error) => {
            finish(error);
        });

        worker.once("exit", (code) => {
            if (code !== 0) {
                finish(new Error(`Worker exited with code ${code}`))
            } else if(!setled) {
                finish(new Error("Worker exited without returing a result"));
            }
        })
    })
}