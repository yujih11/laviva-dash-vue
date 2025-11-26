-- Enable RLS on all tables that currently lack it
ALTER TABLE crescimento_produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE estoque_atual ENABLE ROW LEVEL SECURITY;
ALTER TABLE historico ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos_entrada ENABLE ROW LEVEL SECURITY;
ALTER TABLE previsao_dashboard ENABLE ROW LEVEL SECURITY;

-- Policies for crescimento_produtos
CREATE POLICY "Authenticated users can view growth percentages"
ON crescimento_produtos FOR SELECT
TO authenticated USING (true);

CREATE POLICY "Only admins can insert growth percentages"
ON crescimento_produtos FOR INSERT
TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update growth percentages"
ON crescimento_produtos FOR UPDATE
TO authenticated USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete growth percentages"
ON crescimento_produtos FOR DELETE
TO authenticated USING (has_role(auth.uid(), 'admin'));

-- Policies for estoque_atual
CREATE POLICY "Authenticated users can view inventory"
ON estoque_atual FOR SELECT
TO authenticated USING (true);

CREATE POLICY "Only admins can insert inventory"
ON estoque_atual FOR INSERT
TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update inventory"
ON estoque_atual FOR UPDATE
TO authenticated USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete inventory"
ON estoque_atual FOR DELETE
TO authenticated USING (has_role(auth.uid(), 'admin'));

-- Policies for historico
CREATE POLICY "Authenticated users can view history"
ON historico FOR SELECT
TO authenticated USING (true);

CREATE POLICY "Only admins can insert history"
ON historico FOR INSERT
TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update history"
ON historico FOR UPDATE
TO authenticated USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete history"
ON historico FOR DELETE
TO authenticated USING (has_role(auth.uid(), 'admin'));

-- Policies for pedidos_entrada
CREATE POLICY "Authenticated users can view orders"
ON pedidos_entrada FOR SELECT
TO authenticated USING (true);

CREATE POLICY "Only admins can insert orders"
ON pedidos_entrada FOR INSERT
TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update orders"
ON pedidos_entrada FOR UPDATE
TO authenticated USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete orders"
ON pedidos_entrada FOR DELETE
TO authenticated USING (has_role(auth.uid(), 'admin'));

-- Policies for previsao_dashboard
CREATE POLICY "Authenticated users can view forecasts"
ON previsao_dashboard FOR SELECT
TO authenticated USING (true);

CREATE POLICY "Only admins can insert forecasts"
ON previsao_dashboard FOR INSERT
TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update forecasts"
ON previsao_dashboard FOR UPDATE
TO authenticated USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete forecasts"
ON previsao_dashboard FOR DELETE
TO authenticated USING (has_role(auth.uid(), 'admin'));