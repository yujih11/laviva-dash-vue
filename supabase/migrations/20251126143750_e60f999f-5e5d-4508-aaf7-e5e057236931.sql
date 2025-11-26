-- Add year and month to allow per-month growth configuration per product
ALTER TABLE public.crescimento_produtos
ADD COLUMN IF NOT EXISTS ano integer,
ADD COLUMN IF NOT EXISTS mes integer;

-- Ensure one growth record per product/year/month (treat null as 0 for uniqueness)
CREATE UNIQUE INDEX IF NOT EXISTS crescimento_produtos_codigo_ano_mes_idx
ON public.crescimento_produtos (codigo_produto, COALESCE(ano, 0), COALESCE(mes, 0));