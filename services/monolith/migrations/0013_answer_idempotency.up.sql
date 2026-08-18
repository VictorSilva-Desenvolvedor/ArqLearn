CREATE TABLE answer_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  session_id TEXT NOT NULL,
  question_id TEXT NOT NULL,
  idempotency_key VARCHAR(64) NOT NULL UNIQUE,
  response JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_answer_submissions_user ON answer_submissions(user_id);
