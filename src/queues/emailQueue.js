const { Queue } = require("bullmq");

const emailQueue = new Queue("emailQueue", {
    connection: {
        host: "localhost",
        port: 6379
    },

    defaultJobOptions: {
        attempts: 3,

        backoff: {
            type: "exponential",
            delay: 2000
        },

        removeOnComplete: true,
        removeOnFail: false
    }
});

module.exports = emailQueue;