import fastify = require("fastify");
import { final } from "pino";
import { createConnections, getConnection, getMongoRepository } from "typeorm";
import { Analytics } from "./data/entity/Analytics";
import { AI_Scores } from "./data/entity/Scores";
import { Security } from "./data/entity/Securities";
import { PWL_ApproximationArguments } from "./di/module/args";
import { getLogger } from "./logging/logger"
import { PWL_ApproximateList, PWL_Approximation } from "./REST/main";

const logger = getLogger("server");

process.on(
    "uncaughtExcedption",
    final(logger, (err, finalLogger) => {
        finalLogger.error(err, "uncaughtException");
        process.exit(1);
    })
);

process.on(
    "unhandledRejection",
    final(logger, (err, finalLogger) => {
        finalLogger.error(err, "unhandledRejection");
        process.exit(1);
    })
);

function compositionRoot() {
    const fastifyServer = fastify({
        logger: {
            name: "FastifyServer",
            level: "debug"
        }
    });
    const keepAliveTimeout = Number(process.env.FASTIFY_KEEP_ALIVE);
    if (!isNaN(keepAliveTimeout)) {
        fastifyServer.server.keepAliveTimeout = keepAliveTimeout * 1000;
        // It is recommended to set header's timeout to be slightly > timeout value
        if (keepAliveTimeout !== 0) {
            fastifyServer.server.headersTimeout =
            fastifyServer.server.keepAliveTimeout + 5000;
        }
    }

    const scoreArguments = new PWL_ApproximationArguments(0);

    const connection = getConnection();
    const scoreRepository = getMongoRepository(AI_Scores);
    const securityRepository = getMongoRepository(Security);
    const analyticsRepository = getMongoRepository(Analytics);

    return {
        fastifyServer,
        scoreArguments,
        connection,
        scoreRepository,
        securityRepository,
        analyticsRepository,
    }
}

logger.info('Creating database connection...');
createConnections()
    .then(() => logger.info("Connection successful"))
    .then(compositionRoot)
    .then((context) => {
        context.fastifyServer.post("/pwl_approximation/ticker", (request) =>
            PWL_Approximation(
                request,
                context.scoreArguments,
                context.connection,
                context.scoreRepository,
                context.securityRepository,
                context.analyticsRepository
            )
        );

        context.fastifyServer.post("/pwl_approximation/list", (request) =>
        PWL_ApproximateList(
                request,
                context.scoreArguments,
                context.connection,
                context.scoreRepository,
                context.securityRepository,
                context.analyticsRepository
            )
        );

        context.fastifyServer.post("/pwl_approximation/transform", (request) =>
            PWL_Approximation(
                request,
                context.scoreArguments,
                context.connection,
                context.scoreRepository,
                context.securityRepository,
                context.analyticsRepository
            )
        );

        context.fastifyServer.get("/pwl_approximation/get", (request) =>
            PWL_Approximation(
                request,
                context.scoreArguments,
                context.connection,
                context.scoreRepository,
                context.securityRepository,
                context.analyticsRepository
            )
        );

        context.fastifyServer.listen(
            process.env.HTTP_PORT ? Number(process.env.HTTP_PORT) : 3000,
            (process.env.HTTP_ADDRESS = "127.0.0.1"),
            (err) => {
                if (err) {
                    context.fastifyServer.log.error(err);
                    process.exit(1);
                }
            }
        );
    });
    