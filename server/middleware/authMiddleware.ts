import { AppError } from "../../services/appError";
import { serverLogger } from "../../services/serverLogger";
import { getSupabaseClient } from "../services/authenticatedSupabase";

export async function authMiddleware(req: any, res: any, next: any) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next(new AppError(401, "UNAUTHENTICATED", "Token de autorização não fornecido ou inválido."));
    }
    const token = authHeader.split(" ")[1];
    const client = getSupabaseClient();
    const { data, error } = await client.auth.getUser(token);
    if (error || !data || !data.user) {
      return next(new AppError(401, "UNAUTHENTICATED", "Não autorizado: Token inválido ou expirado.", error?.message));
    }
    req.user = data.user;
    req.token = token;
    next();
  } catch (err: any) {
    serverLogger.error("Erro no Auth Middleware", { error: err.message || err });
    next(new AppError(401, "UNAUTHENTICATED", "Erro de autenticação interno.", err.message));
  }
}
