const { Queue } = require("bullmq");

const emailQueue = new Queue("emailQueue", {
    connection: {
        host: "localhost",
        port: 6379
    }
});

module.exports = emailQueue;