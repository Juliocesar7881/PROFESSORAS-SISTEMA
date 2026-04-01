-- Enable Row Level Security on all application tables in Supabase.
-- Execute this script after prisma migrations in Supabase SQL editor.

alter table "User" enable row level security;
alter table "Turma" enable row level security;
alter table "Aluno" enable row level security;
alter table "Observacao" enable row level security;
alter table "FotoObservacao" enable row level security;
alter table "Avaliacao" enable row level security;
alter table "Planejamento" enable row level security;
alter table "PlanejamentoAtividade" enable row level security;
alter table "Chamada" enable row level security;
alter table "Presenca" enable row level security;
alter table "ProjetoSalvo" enable row level security;
alter table "AuditLog" enable row level security;

-- Example ownership policy for Turma by auth.uid() = userId.
create policy turma_owner_select on "Turma"
for select using ("userId" = auth.uid()::text);

create policy turma_owner_write on "Turma"
for all using ("userId" = auth.uid()::text)
with check ("userId" = auth.uid()::text);
