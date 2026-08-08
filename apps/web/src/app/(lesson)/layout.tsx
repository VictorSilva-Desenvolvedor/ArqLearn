// Route group sem TopAppBar/SideNav/BottomNavBar: a sessão de lição é uma tarefa linear em
// tela cheia por design (ver comentário no code.html de origem em
// Docs/stitch_app_visual_identity/sess_o_de_li_o_quiz/code.html).
export default function LessonLayout({ children }: { children: React.ReactNode }) {
  return <main className="min-h-screen flex flex-col">{children}</main>;
}
