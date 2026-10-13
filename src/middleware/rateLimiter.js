export const rateLimiter = ({
    windowMs = 60_000,
    maxRequests = 10,
} = {}) => {
    const clients = new Map();

    const cleanup = setInterval(() => {
        const now = Date.now();

        for(const [clientId, client] of clients) {
            if (now - client.startTime >= windowMs)  {
                clients.delete(clientId);
            }
        }
        
    }, windowMs);

    cleanup.unref();

    return (req, res, next) => {
        const clientId = req.ip;
        const now =  Date.now();

        let client = clients.get(clientId);

        if (!client || now - client.startTime >= windowMs) {
            client = {
                count: 1,
                startTime: now
            };

            clients.set(clientId, client);

            return next();
        }

        if (client.count >= maxRequests) {
            const retryAfter = Math.ceil((windowMs - (now -client.startTime))/1000) + 'sec';
            
            res.setHeader("Retry-After", retryAfter);

            return res.status(429).json({
                error: "RATE_LIMIT_EXCEEDED",
                message: "Too many requests",
                retryAfter,
            })

        }

        client.count++;

        next();
    }
}