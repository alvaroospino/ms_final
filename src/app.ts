import "dotenv/config";

import { createServer } from "./server.js";
import { appConfig } from "./shared/config/database.config.js";
import { testDatabaseConnection } from "./shared/database/connection.js";
import { printBanner } from "./shared/utils/print-banner.js";

async function bootstrap(): Promise<void> {
  try {
    await testDatabaseConnection();
    console.log("Base de datos conectada correctamente");

    const app = await createServer();

    await app.listen({
      host: appConfig.host,
      port: appConfig.port,
    });

    printBanner(appConfig.port);
  } catch (error) {
    console.error("Error al iniciar el microservicio:", error);
    process.exit(1);
  }
}

bootstrap();
