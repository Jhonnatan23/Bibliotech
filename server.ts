import { createApp } from "./server/app";
import { serverConfig, serverConfigError } from "./services/serverConfig";
import { serverLogger } from "./services/serverLogger";

if (serverConfigError) {
  serverLogger.warn("Aviso de configuração na inicialização do servidor", { warning: serverConfigError.message });
}

const PORT = 3000;

async function startServer() {
  try {
    const app = await createApp();
    const server = app.listen(PORT, "0.0.0.0", () => {
      serverLogger.info(`Server running on http://0.0.0.0:${PORT}`);
    });

    const shutdown = (signal: string) => {
      serverLogger.info(`Recebido ${signal}, encerrando servidor com segurança...`);
      server.close(() => {
        process.exit(0);
      });
      setTimeout(() => process.exit(0), 1500).unref();
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  } catch (err: any) {
    serverLogger.error("Falha ao iniciar o servidor", { error: err.message || err });
    process.exit(1);
  }
}

startServer();
