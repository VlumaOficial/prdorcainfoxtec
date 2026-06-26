-- ════════════════════════════════════════════════════════════
-- INFOXTEC ORÇAMENTO SAAS — Schema inicial (F1)
-- Multi-tenant via empresa_id + RLS
-- Padrão idêntico ao usado no Operax (get_meu_perfil + RLS)
-- ════════════════════════════════════════════════════════════

-- ── EXTENSÕES ──
create extension if not exists "uuid-ossp";
create extension if not exists pg_trgm;

-- ════════════════════════════════════════════════════════════
-- 1. EMPRESAS (tenants)
-- ════════════════════════════════════════════════════════════
create table empresas (
  id              uuid primary key default uuid_generate_v4(),
  nome            text not null,
  cnpj            text,
  endereco        text,
  logo_url        text,
  imposto_pct     numeric(5,2) not null default 0,   -- config padrão da empresa
  margem_pct      numeric(5,2) not null default 0,
  desconto_pct    numeric(5,2) not null default 0,
  cor_primaria    text default '#1db954',             -- preparado pra customização futura
  ativo           boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on table empresas is 'Tenants do sistema (empresas que usam o SaaS de orçamentos)';

-- ════════════════════════════════════════════════════════════
-- 2. USUARIOS (sem diferenciação de papel — todos iguais dentro da empresa)
-- ════════════════════════════════════════════════════════════
create table usuarios (
  id              uuid primary key references auth.users(id) on delete cascade,
  empresa_id      uuid not null references empresas(id) on delete cascade,
  nome            text not null,
  email           text not null,
  ativo           boolean not null default true,
  created_at      timestamptz not null default now()
);

comment on table usuarios is 'Usuários vinculados a uma empresa (tenant). Sem hierarquia/papel — todos com mesmas permissões dentro da própria empresa.';

create index idx_usuarios_empresa on usuarios(empresa_id);

-- ════════════════════════════════════════════════════════════
-- 3. CLIENTES
-- ════════════════════════════════════════════════════════════
create table clientes (
  id              uuid primary key default uuid_generate_v4(),
  empresa_id      uuid not null references empresas(id) on delete cascade,
  nome            text not null,
  cnpj            text,
  endereco        text,
  responsavel     text,
  email           text,
  telefone        text,
  ativo           boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on table clientes is 'Clientes de cada empresa (tenant). Busca por nome/CNPJ para evitar duplicidade.';

create index idx_clientes_empresa on clientes(empresa_id);
create index idx_clientes_cnpj on clientes(empresa_id, cnpj);
create index idx_clientes_nome on clientes using gin (nome gin_trgm_ops);

-- ════════════════════════════════════════════════════════════
-- 4. PRODUTOS (catálogo reutilizável)
-- ════════════════════════════════════════════════════════════
create table produtos (
  id              uuid primary key default uuid_generate_v4(),
  empresa_id      uuid not null references empresas(id) on delete cascade,
  nome            text not null,
  descricao       text,
  custo_padrao    numeric(12,2) not null default 0,
  unidade         text default 'un',     -- un, hora, serviço, m², etc.
  categoria       text,
  ativo           boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on table produtos is 'Catálogo de produtos/serviços reutilizável. Ao usar em orçamento, sistema sugere atualizar custo se houver divergência.';

create index idx_produtos_empresa on produtos(empresa_id);
create index idx_produtos_nome on produtos using gin (nome gin_trgm_ops);

-- ════════════════════════════════════════════════════════════
-- 5. ORÇAMENTOS
-- ════════════════════════════════════════════════════════════
create table orcamentos (
  id                    uuid primary key default uuid_generate_v4(),
  empresa_id            uuid not null references empresas(id) on delete cascade,
  cliente_id            uuid references clientes(id) on delete set null,
  numero                text not null,           -- sugerido automático, editável pelo usuário
  data_emissao          date not null default current_date,
  validade              date,
  titulo                text,
  observacoes_gerais    text,
  condicoes_pagamento   text,

  -- Contato exibido no cabeçalho do orçamento (digitado na hora, varia por proposta/atendente)
  email_contato         text,
  telefone_contato      text,

  -- Configuração global do orçamento (snapshot — não muda se a empresa alterar depois)
  imposto_pct           numeric(5,2) not null default 0,
  margem_pct            numeric(5,2) not null default 0,
  desconto_pct          numeric(5,2) not null default 0,

  -- Totais calculados (cache para listagem rápida — recalculado ao salvar)
  total_custo           numeric(12,2) not null default 0,
  total_imposto          numeric(12,2) not null default 0,
  total_desconto        numeric(12,2) not null default 0,
  total_lucro           numeric(12,2) not null default 0,
  total_final           numeric(12,2) not null default 0,

  status                text not null default 'rascunho',  -- rascunho|enviado|aprovado|recusado (regra a definir na F5)
  criado_por            uuid references usuarios(id),

  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

comment on table orcamentos is 'Orçamentos gerados. Configuração de imposto/margem/desconto é snapshot no momento da criação.';

create index idx_orcamentos_empresa on orcamentos(empresa_id);
create index idx_orcamentos_cliente on orcamentos(cliente_id);
create index idx_orcamentos_status on orcamentos(empresa_id, status);
create index idx_orcamentos_numero on orcamentos(empresa_id, numero);

-- ════════════════════════════════════════════════════════════
-- 6. ORÇAMENTO_ITENS
-- ════════════════════════════════════════════════════════════
create table orcamento_itens (
  id              uuid primary key default uuid_generate_v4(),
  orcamento_id    uuid not null references orcamentos(id) on delete cascade,
  produto_id      uuid references produtos(id) on delete set null,  -- opcional: item livre ou do catálogo

  descricao       text not null,
  qtd             numeric(10,2) not null default 1,
  custo_unit      numeric(12,2) not null default 0,

  -- Override por item (igual à lógica do HTML: checkbox marcado = usa global)
  usa_imp_global   boolean not null default true,
  imp_pct          numeric(5,2),                 -- só usado se usa_imp_global = false

  usa_marg_global  boolean not null default true,
  marg_pct         numeric(5,2),

  usa_desc_global  boolean not null default true,
  desc_pct         numeric(5,2),
  desc_fix         numeric(12,2),                -- desconto em R$ fixo (alternativa ao %)

  ordem            integer not null default 0,   -- ordenação dos itens na tabela
  created_at       timestamptz not null default now()
);

comment on table orcamento_itens is 'Itens do orçamento. Replica exatamente a lógica de Imp/Marg/Desc validada no HTML original.';

create index idx_itens_orcamento on orcamento_itens(orcamento_id);
create index idx_itens_produto on orcamento_itens(produto_id);

-- ════════════════════════════════════════════════════════════
-- 7. FUNÇÃO: get_meu_perfil() — padrão idêntico ao Operax
-- ════════════════════════════════════════════════════════════
create or replace function get_meu_perfil()
returns table (usuario_id uuid, empresa_id uuid, nome text, email text)
security definer
set search_path = public
language sql
stable
as $$
  select id, empresa_id, nome, email
  from usuarios
  where id = auth.uid();
$$;

comment on function get_meu_perfil is 'Retorna o perfil do usuário autenticado, usado nas políticas RLS para filtrar por empresa_id sem recursão.';

-- ════════════════════════════════════════════════════════════
-- 8. TRIGGER: updated_at automático
-- ════════════════════════════════════════════════════════════
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_empresas_updated  before update on empresas  for each row execute function set_updated_at();
create trigger trg_clientes_updated  before update on clientes  for each row execute function set_updated_at();
create trigger trg_produtos_updated  before update on produtos  for each row execute function set_updated_at();
create trigger trg_orcamentos_updated before update on orcamentos for each row execute function set_updated_at();

-- ════════════════════════════════════════════════════════════
-- 9. FUNÇÃO: sugerir próximo número de orçamento
--    (sugestão automática, mas o campo no front fica editável)
-- ════════════════════════════════════════════════════════════
create or replace function sugerir_numero_orcamento(p_empresa_id uuid)
returns text
security definer
set search_path = public
language plpgsql
as $$
declare
  v_ano   text := to_char(current_date, 'YYYY');
  v_seq   integer;
  v_numero text;
begin
  select count(*) + 1 into v_seq
  from orcamentos
  where empresa_id = p_empresa_id
    and numero like 'ORC-' || v_ano || '-%';

  v_numero := 'ORC-' || v_ano || '-' || lpad(v_seq::text, 3, '0');
  return v_numero;
end;
$$;

comment on function sugerir_numero_orcamento is 'Gera sugestão de número sequencial (ex: ORC-2026-003). Usuário pode editar livremente antes de salvar.';

-- ════════════════════════════════════════════════════════════
-- 10. RLS — Row Level Security
-- ════════════════════════════════════════════════════════════
alter table empresas        enable row level security;
alter table usuarios        enable row level security;
alter table clientes        enable row level security;
alter table produtos        enable row level security;
alter table orcamentos      enable row level security;
alter table orcamento_itens enable row level security;

-- EMPRESAS: usuário só vê/edita a própria empresa
create policy "empresas_select" on empresas for select
  using (id = (select empresa_id from get_meu_perfil()));

create policy "empresas_update" on empresas for update
  using (id = (select empresa_id from get_meu_perfil()));

-- USUARIOS: vê apenas usuários da própria empresa
create policy "usuarios_select" on usuarios for select
  using (empresa_id = (select empresa_id from get_meu_perfil()));

create policy "usuarios_update_self" on usuarios for update
  using (id = auth.uid());

-- CLIENTES: CRUD completo dentro da própria empresa
create policy "clientes_select" on clientes for select
  using (empresa_id = (select empresa_id from get_meu_perfil()));
create policy "clientes_insert" on clientes for insert
  with check (empresa_id = (select empresa_id from get_meu_perfil()));
create policy "clientes_update" on clientes for update
  using (empresa_id = (select empresa_id from get_meu_perfil()));
create policy "clientes_delete" on clientes for delete
  using (empresa_id = (select empresa_id from get_meu_perfil()));

-- PRODUTOS: CRUD completo dentro da própria empresa
create policy "produtos_select" on produtos for select
  using (empresa_id = (select empresa_id from get_meu_perfil()));
create policy "produtos_insert" on produtos for insert
  with check (empresa_id = (select empresa_id from get_meu_perfil()));
create policy "produtos_update" on produtos for update
  using (empresa_id = (select empresa_id from get_meu_perfil()));
create policy "produtos_delete" on produtos for delete
  using (empresa_id = (select empresa_id from get_meu_perfil()));

-- ORCAMENTOS: CRUD completo dentro da própria empresa
create policy "orcamentos_select" on orcamentos for select
  using (empresa_id = (select empresa_id from get_meu_perfil()));
create policy "orcamentos_insert" on orcamentos for insert
  with check (empresa_id = (select empresa_id from get_meu_perfil()));
create policy "orcamentos_update" on orcamentos for update
  using (empresa_id = (select empresa_id from get_meu_perfil()));
create policy "orcamentos_delete" on orcamentos for delete
  using (empresa_id = (select empresa_id from get_meu_perfil()));

-- ORCAMENTO_ITENS: acesso via join com orcamentos (item pertence à empresa do orçamento pai)
create policy "itens_select" on orcamento_itens for select
  using (
    orcamento_id in (
      select id from orcamentos where empresa_id = (select empresa_id from get_meu_perfil())
    )
  );
create policy "itens_insert" on orcamento_itens for insert
  with check (
    orcamento_id in (
      select id from orcamentos where empresa_id = (select empresa_id from get_meu_perfil())
    )
  );
create policy "itens_update" on orcamento_itens for update
  using (
    orcamento_id in (
      select id from orcamentos where empresa_id = (select empresa_id from get_meu_perfil())
    )
  );
create policy "itens_delete" on orcamento_itens for delete
  using (
    orcamento_id in (
      select id from orcamentos where empresa_id = (select empresa_id from get_meu_perfil())
    )
  );
