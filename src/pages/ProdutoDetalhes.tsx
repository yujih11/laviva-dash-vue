import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, TrendingUp, Package, Calendar } from "lucide-react";
import { cleanProductName } from "@/lib/product-utils";
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts";

interface PrevisaoData {
  mes: string | number;
  ano: string | number;
  total_previsto: number;
  previsao_por_cliente?: Record<string, number>;
}

interface VendasData {
  mes: number;
  ano: number;
  total_vendido: number;
  vendas_por_cliente?: Record<string, number>;
}

export default function ProdutoDetalhes() {
  const { codigoProduto } = useParams<{ codigoProduto: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [produtoNome, setProdutoNome] = useState("");
  const [previsoes, setPrevisoes] = useState<PrevisaoData[]>([]);
  const [vendasReais, setVendasReais] = useState<VendasData[]>([]);
  const [estoque, setEstoque] = useState(0);
  const [anoSelecionado, setAnoSelecionado] = useState<number>(2025);
  const [mesSelecionado, setMesSelecionado] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!codigoProduto) return;

      setLoading(true);
      try {
        // Buscar previsões
        const { data: previsoesData } = await supabase
          .from("previsao_resumida_por_codigo")
          .select("*")
          .eq("codigo_produto", codigoProduto);

        // Buscar vendas reais
        const { data: vendasData } = await supabase
          .from("vendas_reais_resumidas_por_codigo")
          .select("*")
          .eq("codigo_produto", codigoProduto);

        // Buscar estoque
        const { data: estoqueData } = await supabase
          .from("estoque_resumido")
          .select("*")
          .eq("codigo_produto", codigoProduto)
          .single();

        if (previsoesData && previsoesData.length > 0) {
          setProdutoNome(cleanProductName(previsoesData[0].produto || ""));
          setPrevisoes(previsoesData as PrevisaoData[]);
        }

        if (vendasData) {
          setVendasReais(vendasData as VendasData[]);
        }

        if (estoqueData) {
          setEstoque(estoqueData.estoque_disponivel || 0);
        }
      } catch (error) {
        console.error("Erro ao carregar dados do produto:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [codigoProduto]);

  // Preparar dados para o gráfico de linha (previsão vs realizado ao longo do ano)
  const mesMap: Record<string, number> = {
    'jan': 1, 'fev': 2, 'mar': 3, 'abr': 4, 'mai': 5, 'jun': 6,
    'jul': 7, 'ago': 8, 'set': 9, 'out': 10, 'nov': 11, 'dez': 12
  };
  const mesNomes = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

  const dadosGraficoLinha = mesNomes.map((mesNome, idx) => {
    const mesNum = idx + 1;
    
    // Filtrar por mês se selecionado
    if (mesSelecionado !== null && mesNum !== mesSelecionado) {
      return null;
    }
    
    const previsao = previsoes.find(p => {
      const mesStr = String(p.mes).toLowerCase();
      const pMes = mesMap[mesStr] || parseInt(String(p.mes));
      const pAno = typeof p.ano === 'string' ? parseInt(p.ano) : p.ano;
      return pMes === mesNum && pAno === anoSelecionado;
    });

    const vendas = vendasReais.find(v => v.mes === mesNum && v.ano === anoSelecionado);

    return {
      mes: mesNome,
      previsao: previsao?.total_previsto || 0,
      realizado: vendas?.total_vendido || 0,
    };
  }).filter(Boolean);

  // Preparar dados para o gráfico de barras (vendas por cliente)
  const clientesMap: Record<string, number> = {};
  
  vendasReais
    .filter(venda => {
      if (mesSelecionado !== null && venda.mes !== mesSelecionado) return false;
      if (venda.ano !== anoSelecionado) return false;
      return true;
    })
    .forEach(venda => {
      if (venda.vendas_por_cliente && typeof venda.vendas_por_cliente === 'object') {
        Object.entries(venda.vendas_por_cliente).forEach(([cliente, quantidade]) => {
          if (!clientesMap[cliente]) {
            clientesMap[cliente] = 0;
          }
          clientesMap[cliente] += Number(quantidade);
        });
      }
    });

  const dadosGraficoBarras = Object.entries(clientesMap)
    .map(([cliente, quantidade]) => ({
      cliente,
      quantidade,
    }))
    .sort((a, b) => b.quantidade - a.quantidade)
    .slice(0, 10); // Top 10 clientes

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-64 mb-8" />
          <div className="grid gap-6 md:grid-cols-2">
            <Skeleton className="h-96" />
            <Skeleton className="h-96" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">{produtoNome}</h1>
              <p className="text-sm text-muted-foreground mt-1">Código: {codigoProduto}</p>
            </div>
          </div>
          
          {/* Filtros */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Select value={String(anoSelecionado)} onValueChange={(v) => setAnoSelecionado(parseInt(v))}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2025">2025</SelectItem>
                  <SelectItem value="2026">2026</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Select value={mesSelecionado === null ? "todos" : String(mesSelecionado)} onValueChange={(v) => setMesSelecionado(v === "todos" ? null : parseInt(v))}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Todos os meses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os meses</SelectItem>
                <SelectItem value="1">Janeiro</SelectItem>
                <SelectItem value="2">Fevereiro</SelectItem>
                <SelectItem value="3">Março</SelectItem>
                <SelectItem value="4">Abril</SelectItem>
                <SelectItem value="5">Maio</SelectItem>
                <SelectItem value="6">Junho</SelectItem>
                <SelectItem value="7">Julho</SelectItem>
                <SelectItem value="8">Agosto</SelectItem>
                <SelectItem value="9">Setembro</SelectItem>
                <SelectItem value="10">Outubro</SelectItem>
                <SelectItem value="11">Novembro</SelectItem>
                <SelectItem value="12">Dezembro</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Estoque Atual
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {estoque.toLocaleString("pt-BR")}
              </div>
              <p className="text-xs text-muted-foreground mt-1">unidades disponíveis</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Previsão Total {anoSelecionado}
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {previsoes
                  .filter(p => {
                    const pAno = typeof p.ano === 'string' ? parseInt(p.ano) : p.ano;
                    const mesStr = String(p.mes).toLowerCase();
                    const pMes = mesMap[mesStr] || parseInt(String(p.mes));
                    if (mesSelecionado !== null && pMes !== mesSelecionado) return false;
                    return pAno === anoSelecionado;
                  })
                  .reduce((acc, p) => acc + (p.total_previsto || 0), 0)
                  .toLocaleString("pt-BR")}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {mesSelecionado ? `unidades previstas no mês ${mesSelecionado}` : "unidades previstas no ano"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Vendas Total {anoSelecionado}
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {vendasReais
                  .filter(v => {
                    if (mesSelecionado !== null && v.mes !== mesSelecionado) return false;
                    return v.ano === anoSelecionado;
                  })
                  .reduce((acc, v) => acc + (v.total_vendido || 0), 0)
                  .toLocaleString("pt-BR")}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {mesSelecionado ? `unidades vendidas no mês ${mesSelecionado}` : "unidades vendidas no ano"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos */}
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
          {/* Gráfico de Linha: Previsão vs Realizado */}
          <Card>
            <CardHeader>
              <CardTitle>Previsão vs Realizado {anoSelecionado}</CardTitle>
              <CardDescription>
                {mesSelecionado 
                  ? `Comparação para o mês ${mesSelecionado}/${anoSelecionado}`
                  : `Comparação mensal entre valores previstos e realizados em ${anoSelecionado}`
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dadosGraficoLinha}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="mes" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "6px",
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="previsao"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    name="Previsão"
                    dot={{ fill: "hsl(var(--primary))" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="realizado"
                    stroke="hsl(var(--success))"
                    strokeWidth={2}
                    name="Realizado"
                    dot={{ fill: "hsl(var(--success))" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Gráfico de Barras: Vendas por Cliente */}
          <Card>
            <CardHeader>
              <CardTitle>Top 10 Clientes</CardTitle>
              <CardDescription>
                {mesSelecionado 
                  ? `Volume de vendas por cliente no mês ${mesSelecionado}/${anoSelecionado}`
                  : `Volume de vendas por cliente em ${anoSelecionado}`
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dadosGraficoBarras}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="cliente"
                    className="text-xs"
                    angle={-45}
                    textAnchor="end"
                    height={100}
                  />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "6px",
                    }}
                  />
                  <Bar
                    dataKey="quantidade"
                    fill="hsl(var(--primary))"
                    name="Quantidade"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
