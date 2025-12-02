-- Remover políticas restritivas antigas que exigem admin
DROP POLICY IF EXISTS "Only admins can insert growth percentages" ON public.crescimento_produtos;
DROP POLICY IF EXISTS "Only admins can update growth percentages" ON public.crescimento_produtos;
DROP POLICY IF EXISTS "Only admins can delete growth percentages" ON public.crescimento_produtos;
DROP POLICY IF EXISTS "Authenticated users can view growth percentages" ON public.crescimento_produtos;