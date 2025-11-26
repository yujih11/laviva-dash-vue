-- Ensure a real unique constraint on codigo_produto, ano, mes for upsert support
ALTER TABLE public.crescimento_produtos
ADD CONSTRAINT crescimento_produtos_codigo_ano_mes_unique
UNIQUE (codigo_produto, ano, mes);