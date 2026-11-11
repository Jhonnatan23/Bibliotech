import { AppError } from "../../services/appError";
import { serverLogger } from "../../services/serverLogger";
import { getSupabaseClient } from "../services/authenticatedSupabase";

export async function authMiddleware(req: any, res: any, next: any) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next(new AppError(401, "UNAUTHENTICATED", "Token de autorização não fornecido ou inválido."));
    }
    const token = authHeader.split(" ")[1]?.trim();
    if (!token) {
      return next(new AppError(401, "UNAUTHENTICATED", "Token de autorização não fornecido ou inválido."));
    }

    const client = getSupabaseClient();
    try {
      const { data, error } = await client.auth.getUser(token);
      if (error || !data || !data.user) {
        serverLogger.warn("Validação de usuário rejeitada no Auth Middleware", {
          message: error?.message || "Usuário não encontrado",
          tokenPrefix: token.substring(0, 12) + "..."
        });
        return next(new AppError(401, "UNAUTHENTICATED", "Não autorizado: Token inválido ou expirado.", error?.message));
      }
      req.user = data.user;
      req.token = token;
      next();
    } catch (authErr: any) {
      serverLogger.warn("Token JWT inválido ou rejeitado pelo provedor no Auth Middleware", {
        error: authErr?.message || String(authErr),
        tokenPrefix: token.substring(0, 12) + "..."
      });
      return next(new AppError(401, "UNAUTHENTICATED", "Não autorizado: Token inválido ou expirado.", authErr?.message));
    }
  } catch (err: any) {
    serverLogger.warn("Falha geral no Auth Middleware", { error: err.message || err });
    next(new AppError(401, "UNAUTHENTICATED", "Erro de autenticação interno.", err.message));
  }
}
