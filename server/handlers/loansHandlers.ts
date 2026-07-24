import nodemailer from "nodemailer";
import { AppError, asyncHandler } from "../../services/appError";
import { serverLogger } from "../../services/serverLogger";
import { serverConfig } from "../../services/serverConfig";
import { getSupabaseClient } from "../services/authenticatedSupabase";

export const createLoanHandler = asyncHandler(async (req: any, res: any) => {
  const { bookId, borrowerName, borrowerEmail, dueDate } = req.body;

  if (!bookId || !borrowerName || !dueDate) {
    throw new AppError(400, "VALIDATION_ERROR", "Campos obrigatórios ausentes: bookId, borrowerName, dueDate.");
  }

  // Initialize user-scoped client
  const userSupabase = getSupabaseClient(req.token);

  // 1. Obter informações do livro para o e-mail e validação, garantindo que pertence ao usuário logado
  const { data: book, error: bookError } = await userSupabase
    .from("books")
    .select("title, author")
    .eq("id", bookId)
    .eq("user_id", req.user.id)
    .single();

  if (bookError || !book) {
    throw new AppError(404, "NOT_FOUND", "Livro não encontrado ou não pertence a este usuário.");
  }

  // 2. Registrar o empréstimo na tabela 'loans' usando req.user.id
  const { data: loan, error: loanError } = await userSupabase
    .from("loans")
    .insert({
      user_id: req.user.id,
      book_id: bookId,
      borrower_name: borrowerName,
      borrower_email: borrowerEmail || null,
      due_date: dueDate,
      status: "active"
    })
    .select()
    .single();

  if (loanError) {
    serverLogger.error("Erro ao salvar empréstimo no Loans Backend", { error: loanError.message || loanError, requestId: req.requestId });
    throw new AppError(500, "INTERNAL_ERROR", "Erro ao registrar o empréstimo no banco de dados.", loanError.message);
  }

  // 3. Atualizar o livro na tabela 'books' marcando como emprestado
  const { error: updateBookError } = await userSupabase
    .from("books")
    .update({
      is_loaned: true,
      borrower_name: borrowerName,
      loan_date: new Date().toISOString().split("T")[0]
    })
    .eq("id", bookId)
    .eq("user_id", req.user.id);

  if (updateBookError) {
    serverLogger.error("Erro ao atualizar status do livro no Loans Backend", { error: updateBookError.message || updateBookError, requestId: req.requestId });
  }

  // 4. Enviar e-mail de confirmação se o borrowerEmail estiver presente
  if (borrowerEmail) {
    try {
      const emailUser = serverConfig.emailUser;
      const emailPass = serverConfig.emailPass;

      if (emailPass && emailUser) {
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: emailUser,
            pass: emailPass,
          },
        });

        const formattedDueDate = new Date(dueDate).toLocaleDateString("pt-BR");
        
        const htmlContent = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f1f5f9; border-radius: 24px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05); background-color: #ffffff;">
            <div style="background-color: #4f46e5; color: white; padding: 24px; text-align: center; border-radius: 16px 16px 0 0;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 900; letter-spacing: -0.025em;">BiblioTech</h1>
              <p style="margin: 4px 0 0 0; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.1em; opacity: 0.85;">Confirmação de Empréstimo</p>
            </div>
            <div style="padding: 24px; color: #1e293b;">
              <p style="font-size: 16px; line-height: 1.5; margin-top: 0;">Olá, <strong>${borrowerName}</strong>!</p>
              <p style="font-size: 14px; line-height: 1.6; color: #475569;">
                Este é um e-mail automático para confirmar que você pegou a seguinte obra emprestada:
              </p>
              <div style="background-color: #f8fafc; padding: 20px; border-left: 4px solid #4f46e5; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; font-size: 16px; font-weight: bold; color: #0f172a;">${book.title}</p>
                <p style="margin: 4px 0 0 0; font-size: 13px; color: #64748b; font-weight: 500;">por ${book.author}</p>
              </div>
              <p style="font-size: 14px; line-height: 1.6; color: #475569;">
                📅 <strong>Data limite de devolução:</strong> <span style="color: #4f46e5; font-weight: bold;">${formattedDueDate}</span>
              </p>
              <p style="font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 0;">
                Por favor, lembre-se de devolver dentro do prazo combinado. Boa leitura!
              </p>
            </div>
            <div style="background-color: #f8fafc; padding: 16px; text-align: center; border-radius: 0 0 16px 16px; border-top: 1px solid #f1f5f9; font-size: 11px; color: #94a3b8; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em;">
              BiblioTech &copy; ${new Date().getFullYear()} &bull; Organização inteligente de leituras
            </div>
          </div>
        `;

        await transporter.sendMail({
          from: `"BiblioTech" <${emailUser}>`,
          to: borrowerEmail,
          subject: `Empréstimo Confirmado: "${book.title}"`,
          html: htmlContent
        });
        serverLogger.info("Envio de e-mail concluído", {
          provider: "gmail-provider",
          requestId: req.requestId,
          recipientDomain: borrowerEmail && borrowerEmail.includes('@') ? borrowerEmail.split('@')[1] : undefined,
        });
      } else {
        serverLogger.warn("Envio de e-mail simulado", {
          provider: "simulated-provider",
          requestId: req.requestId,
          recipientDomain: borrowerEmail && borrowerEmail.includes('@') ? borrowerEmail.split('@')[1] : undefined,
        });
      }
    } catch (emailErr: any) {
      serverLogger.error("Erro ao disparar e-mail de confirmação no Loans Backend", {
        provider: "gmail-provider",
        requestId: req.requestId,
        recipientDomain: borrowerEmail && borrowerEmail.includes('@') ? borrowerEmail.split('@')[1] : undefined,
        error: emailErr.message || emailErr,
      });
    }
  }

  return res.status(201).json({ success: true, loan });
});

export const returnLoanHandler = asyncHandler(async (req: any, res: any) => {
  const { id } = req.params;

  const userSupabase = getSupabaseClient(req.token);

  // 1. Obter informações do empréstimo existente e validar se pertence ao usuário
  const { data: loan, error: fetchError } = await userSupabase
    .from("loans")
    .select("book_id, borrower_name, user_id")
    .eq("id", id)
    .eq("user_id", req.user.id)
    .single();

  if (fetchError || !loan) {
    throw new AppError(404, "NOT_FOUND", "Empréstimo não encontrado ou não pertence a este usuário.");
  }

  // 2. Atualizar o registro do empréstimo para 'returned' com a data real de retorno
  const { data: updatedLoan, error: updateLoanError } = await userSupabase
    .from("loans")
    .update({
      return_date: new Date().toISOString(),
      status: "returned"
    })
    .eq("id", id)
    .eq("user_id", req.user.id)
    .select()
    .single();

  if (updateLoanError) {
    serverLogger.error("Erro ao finalizar empréstimo no Loans Backend", { error: updateLoanError.message || updateLoanError, requestId: req.requestId });
    throw new AppError(500, "INTERNAL_ERROR", "Erro ao atualizar o empréstimo no banco de dados.", updateLoanError.message);
  }

  // 3. Atualizar o livro correspondente para is_loaned = false
  const { error: updateBookError } = await userSupabase
    .from("books")
    .update({
      is_loaned: false,
      borrower_name: null,
      loan_date: null
    })
    .eq("id", loan.book_id)
    .eq("user_id", req.user.id);

  if (updateBookError) {
    serverLogger.error("Erro ao limpar informações de empréstimo do livro no Loans Backend", { error: updateBookError.message || updateBookError, requestId: req.requestId });
  }

  return res.json({ success: true, loan: updatedLoan });
});
