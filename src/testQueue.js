const emailQueue = require("./queues/emailQueue");

const addJob = async () => {
    const job = await emailQueue.add(
        "sendWelcomeEmail",
        {
            email: "test@example.com",
            name: "Nazir"
        }
    );

    console.log("Job added successfully");
    console.log("Job ID:", job.id);

    process.exit(0);
};

addJob();