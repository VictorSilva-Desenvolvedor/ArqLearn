// Corrige um erro de estruturação de conteúdo do seed 003: cada uma das 4 disciplinas novas
// (Docs/DocsFaculdade) foi gravada como UMA lição de 50 perguntas, em vez de várias lições
// pequenas. handleStartSession (internal/learning/session.go) não pagina — pega TODAS as
// perguntas de l.question_ids de uma vez numa sessão só. Nenhuma outra lição do app tem 50
// perguntas (Maquetes tem ~5-14 por unidade); o resultado prático era uma sessão de prática de
// 50 perguntas de uma vez, e nenhum "próximo nó" no mapa de aprendizado depois de terminar (só
// existe 1 unit por trilha nova em vez de várias).
//
// Este script divide cada lição de 50 em 5 lições de 10 (mesma ordem das perguntas já existente
// em question_ids), atualiza questions.lesson_id de cada pergunta pra apontar pra lição nova
// correta, cria as 5 lições novas, remove a lição monolítica antiga e substitui a única entry de
// track.units correspondente por 5 entries em sequência.
//
// Idempotente: se já rodou (lição antiga não existe mais), pula a disciplina sem erro.
//
// Uso: mongosh "$MONGODB_URI" services/monolith/seeds/004_divide_novas_materias_em_licoes_de_10.js

const database = db.getSiblingDB("arqlearn");
const now = new Date();
const CHUNK_SIZE = 10;

const disciplinas = [
  {
    trackId: "track_s01_construcoes_sustentaveis",
    oldLessonId: "lesson_construcoes_sustentaveis_u3",
    baseTitle: "Unidade 3 — Uso dos Recursos Naturais e a Geração de Resíduos da Construção Civil",
  },
  {
    trackId: "track_s02_desenho_arquitetura_urbanismo",
    oldLessonId: "lesson_desenho_arquitetura_urbanismo_u4",
    baseTitle: "Unidade 4 — Representação de Coberturas, Elementos Verticais e Detalhamentos",
  },
  {
    trackId: "track_s03_projeto_arquitetura_cultural",
    oldLessonId: "lesson_projeto_arquitetura_cultural_u4",
    baseTitle: "Unidade 4 — Apresentação e detalhamento construtivo do anteprojeto",
  },
  {
    trackId: "track_s03_informatica_projecoes_ortogonais",
    oldLessonId: "lesson_informatica_projecoes_ortogonais_u4",
    baseTitle: "Unidade 4 — Configurando impressão e plotagem",
  },
];

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

let totalLessonsCreated = 0;
let totalQuestionsMoved = 0;

disciplinas.forEach((d) => {
  const oldLesson = database.lessons.findOne({ _id: d.oldLessonId });
  if (!oldLesson) {
    print(`[pular] ${d.oldLessonId} não existe mais — provavelmente já dividida antes.`);
    return;
  }

  const chunks = chunk(oldLesson.question_ids || [], CHUNK_SIZE);
  const newLessonIds = [];

  chunks.forEach((questionIds, index) => {
    const part = index + 1;
    const newLessonId = `${d.oldLessonId}_p${part}`;
    const title = `${d.baseTitle} (${part}/${chunks.length})`;

    database.lessons.updateOne(
      { _id: newLessonId },
      {
        $setOnInsert: {
          _id: newLessonId,
          track_id: d.trackId,
          title,
          difficulty: "medium",
          question_ids: questionIds,
          estimated_minutes: 8,
          created_at: now,
        },
        $set: { updated_at: now },
      },
      { upsert: true },
    );

    database.questions.updateMany(
      { _id: { $in: questionIds } },
      { $set: { lesson_id: newLessonId, updated_at: now } },
    );

    newLessonIds.push(newLessonId);
    totalQuestionsMoved += questionIds.length;
  });

  // Substitui a única unit antiga (referenciando oldLessonId) por N units novas, mantendo a
  // posição/order relativa das outras units da trilha (nesse caso não há outras — trilhas novas
  // começaram com units: [] antes do seed 003).
  const track = database.tracks.findOne({ _id: d.trackId }, { units: 1 });
  const otherUnits = (track.units || []).filter(
    (u) => !(u.lesson_ids || []).includes(d.oldLessonId),
  );
  const newUnits = newLessonIds.map((lessonId, i) => ({
    id: `unit_${lessonId}`,
    title: `${d.baseTitle} (${i + 1}/${chunks.length})`,
    order: otherUnits.length + i + 1,
    lesson_ids: [lessonId],
  }));
  database.tracks.updateOne(
    { _id: d.trackId },
    { $set: { units: [...otherUnits, ...newUnits], updated_at: now } },
  );

  database.lessons.deleteOne({ _id: d.oldLessonId });

  totalLessonsCreated += newLessonIds.length;
  print(`${d.oldLessonId}: dividida em ${newLessonIds.length} lições de até ${CHUNK_SIZE} perguntas.`);
});

print(`\n${totalLessonsCreated} lições novas criadas, ${totalQuestionsMoved} perguntas realocadas.`);
