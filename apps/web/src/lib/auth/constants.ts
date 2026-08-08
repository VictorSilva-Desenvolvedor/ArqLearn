// Nome do cookie que guarda a conta mockada atual. Precisa ser um cookie de verdade (não só
// localStorage) para o middleware conseguir ler no servidor e proteger rotas antes do render.
export const ACCOUNT_COOKIE = "arqlearn_mock_account";
export const ACCOUNT_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 dias
