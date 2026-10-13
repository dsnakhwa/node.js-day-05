import { parentPort, workerData} from "node:worker_threads";


function calculate(iterations) {
    let result = 0;

    for (let i = 0; i < iterations; i ++) {
        result += Math.sqrt(i);
    }
    return result;
}

try {
    const result = calculate(workerData.iterations);

    parentPort.postMessage({
        success: true,
        result,
    });
} catch (error) {
    parentPort.postMessage({
        success: false,
        error: error.messgae,
    })
}