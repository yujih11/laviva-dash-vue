-- Tabela para previsões de produção manuais
CREATE TABLE public.previsao_producao_manual (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo_produto TEXT NOT NULL,
  quantidade INTEGER NOT NULL,
  ano INTEGER,
  mes INTEGER,
  cliente TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(codigo_produto, ano, mes, cliente)
);

-- Habilitar RLS
ALTER TABLE public.previsao_producao_manual ENABLE ROW LEVEL SECURITY;

-- Políticas para usuários autenticados
CREATE POLICY "Usuários autenticados podem ver previsão produção" 
ON public.previsao_producao_manual 
FOR SELECT 
USING (true);

CREATE POLICY "Usuários autenticados podem inserir previsão produção" 
ON public.previsao_producao_manual 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar previsão produção" 
ON public.previsao_producao_manual 
FOR UPDATE 
USING (true)
WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem deletar previsão produção" 
ON public.previsao_producao_manual 
FOR DELETE 
USING (true);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_previsao_producao_manual_updated_at
BEFORE UPDATE ON public.previsao_producao_manual
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();