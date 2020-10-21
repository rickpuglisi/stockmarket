import { getLogger } from "../logging/logger";

const logger = getLogger("rest/lib");

function success(result: any) {
    result.status = 0;
    return result;
}

export async function safeRun(
    action: () => Promise<any>,
    name: string
): Promise<any> {
    try {
        return success(await action());
    } catch (e) {
        const errData = {
            message: `Failed to run ${name}: ${e.message}`,
            stack: e.stack,
        };
        logger.fatal(errData.message, e);
        return { status: -1, errMessages: [errData] };
    }
}
