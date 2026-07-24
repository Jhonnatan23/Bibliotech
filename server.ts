import { createApp } from "./server/app";
import { serverConfig, serverConfigError } from "./services/serverConfig";
import { serverLogger } from "./services/serverLogger";

if (serverConfigError) {
  serverLogger.warn("Aviso de configuração na inicialização do servidor", { warning: serverConfigError.message });
}

const PORT = serverConfig.port;

async function startServer() {
  try {
    const app = await createApp();
    app.listen(PORT, "0.0.0.0", () => {
      serverLogger.info(`Server running on http://0.0.0.0:${PORT}`);
    });
  } catch (err: any) {
    serverLogger.error("Falha ao iniciar o servidor", { error: err.message || err });
    process.exit(1);
  }
}

startServer();
