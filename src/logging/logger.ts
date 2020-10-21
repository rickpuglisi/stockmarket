import * as pino from "pino";

const LOGGER_LEVELS = {
    main: "info",
}

export function getLogger(name: string): pino.Logger {
    return pino(
        {
            name,
            level: LOGGER_LEVELS[name] || "info",
        },
        pino.destination() // for sync logging
    );
}
