module.exports = [
    {
        name: "default",
        type: "mongodb",
        url: process.env.MONGODB_URI,
        synchronize: false,
        logging: true,
        entities: ["src/data/entity/*.ts"],
    },
];
