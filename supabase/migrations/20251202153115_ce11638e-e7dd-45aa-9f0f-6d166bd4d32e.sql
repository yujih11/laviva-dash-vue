-- Adicionar coluna cliente na tabela crescimento_produtos
ALTER TABLE public.crescimento_produtos 
ADD COLUMN cliente text NULL;

-- Remover a constraint única antiga
ALTER TABLE public.crescimento_produtos 
DROP CONSTRAINT crescimento_produtos_codigo_ano_mes_unique;

-- Criar novo índice único incluindo cliente
CREATE UNIQUE INDEX crescimento_produtos_codigo_ano_mes_cliente_unique 
ON public.crescimento_produtos (codigo_produto, ano, mes, cliente);

-- Comentário para documentação
COMMENT ON COLUMN public.crescimento_produtos.cliente IS 'Cliente específico para o crescimento (NULL = todos os clientes)';