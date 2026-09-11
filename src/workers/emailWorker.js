const { Worker } = require("bullmq");

const emailWorker = new Worker(
    "emailQueue",
    async (job) => {
        console.log("Processing job:", job.name);
        console.log("Job data:", job.data);

        // Simulate background work
        await new Promise((resolve) => {
            setTimeout(resolve, 2000);
        });

        console.log("Job completed:", job.id);
    },
    {
        connection: {
            host: "localhost",
            port: 6379
        }
    }
);

emailWorker.on("completed", (job) => {
    console.log(`Job ${job.id} completed successfully`);
});

emailWorker.on("failed", (job, error) => {
    console.error(`Job ${job?.id} failed:`, error.message);
});

console.log("Email worker is running...");