// Cookie (não só localStorage) pra Server Components como a Home lerem o tema selecionado
// antes de montar o Mapa de Aprendizado — mesmo raciocínio do ACCOUNT_COOKIE em lib/auth.
export const THEME_COOKIE = "arqlearn_theme_topic";
export const THEME_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 dias
