-- Criar política para permitir SELECT em crescimento_produtos para todos autenticados
CREATE POLICY "Usuários autenticados podem ver crescimento"
ON public.crescimento_produtos
FOR SELECT
TO authenticated
USING (true);

-- Criar política para permitir INSERT em crescimento_produtos para autenticados
CREATE POLICY "Usuários autenticados podem inserir crescimento"
ON public.crescimento_produtos
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Criar política para permitir UPDATE em crescimento_produtos para autenticados
CREATE POLICY "Usuários autenticados podem atualizar crescimento"
ON public.crescimento_produtos
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Criar política para permitir DELETE em crescimento_produtos para autenticados
CREATE POLICY "Usuários autenticados podem deletar crescimento"
ON public.crescimento_produtos
FOR DELETE
TO authenticated
USING (true);