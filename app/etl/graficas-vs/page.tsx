'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, Trash2 } from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function GraficasVsPage() {
  const [queries, setQueries] = useState<any[]>([]);
  const [selectedQueryId, setSelectedQueryId] = useState<string | null>(null);
  const [chartData, setChartData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Cargar consultas desde localStorage
  const loadQueries = () => {
    const savedQueries = localStorage.getItem('etl_query_history');
    if (savedQueries) {
      try {
        const parsedQueries = JSON.parse(savedQueries);
        const etlQueries = parsedQueries.filter(
          (q: any) => q.isETL && q.multiDBResults && Object.keys(q.multiDBResults).length > 0
        );
        setQueries(etlQueries);
        if (etlQueries.length > 0 && !selectedQueryId) {
          setSelectedQueryId(etlQueries[0].id);
        }
      } catch (error) {
        console.error('Error al cargar consultas:', error);
      }
    }
    setLoading(false);
  };

  // Limpiar historial completo
  const clearHistory = () => {
    if (
      window.confirm(
        '¿Estás seguro de que deseas eliminar todo el historial de ETL? Esta acción no se puede deshacer.'
      )
    ) {
      localStorage.removeItem('etl_query_history');
      setQueries([]);
      setSelectedQueryId(null);
      setChartData(null);
    }
  };

  // Cargar consultas al montar el componente
  useEffect(() => {
    loadQueries();
  }, []);

  // Procesar datos cuando se selecciona una consulta
  useEffect(() => {
    if (!selectedQueryId || queries.length === 0) {
      setChartData(null);
      return;
    }

    const selected = queries.find((q) => q.id === selectedQueryId);
    if (!selected || !selected.multiDBResults) {
      setChartData(null);
      return;
    }

    // Obtener columnas numéricas
    const labelCol = selected.columns?.[0] || 'name';
    const numericCols = selected.columns?.filter((col: string) => {
      const firstDb = Object.values(selected.multiDBResults)[0];
      if (Array.isArray(firstDb) && firstDb.length > 0) {
        const val = firstDb[0][col];
        return val !== null && val !== undefined && !isNaN(Number(val));
      }
      return false;
    }) || [];

    if (numericCols.length === 0) {
      setChartData(null);
      return;
    }

    // Combinar datos lado a lado
    const unifiedData: Record<string, any> = {};
    Object.entries(selected.multiDBResults).forEach(([dbName, dbResult]: [string, any]) => {
      if (Array.isArray(dbResult)) {
        dbResult.forEach((row: any) => {
          const label = String(row[labelCol] ?? 'N/A');
          if (!unifiedData[label]) {
            unifiedData[label] = { name: label };
          }
          numericCols.forEach((col: string) => {
            const value = Number(row[col]) || 0;
            unifiedData[label][`${col}_${dbName}`] = value;
          });
        });
      }
    });

    const finalData = Object.values(unifiedData);
    if (finalData.length === 0) {
      setChartData(null);
      return;
    }

    // Preparar datos para Chart.js
    const dbNames = Object.keys(selected.multiDBResults);
    const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

    const datasets = numericCols.flatMap((col: string, colIdx: number) =>
      dbNames.map((dbName, dbIdx) => ({
        label: `${col} (${dbName})`,
        data: finalData.map((item) => item[`${col}_${dbName}`] || 0),
        backgroundColor: COLORS[(colIdx * dbNames.length + dbIdx) % COLORS.length],
      }))
    );

    setChartData({
      labels: finalData.map((item) => item.name),
      datasets,
    });
  }, [selectedQueryId, queries]);

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center text-gray-400">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-8">
      <div>
        <h1 className="text-4xl font-bold text-white">Gráficas vs - Comparación ETL</h1>
        <p className="text-gray-400 mt-2">Visualiza comparaciones lado a lado entre bases de datos</p>
      </div>

      {/* Botones de acción */}
      <div className="flex gap-2">
        <Button
          onClick={loadQueries}
          variant="outline"
          className="gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Recargar
        </Button>
        <Button
          onClick={clearHistory}
          variant="destructive"
          className="gap-2"
        >
          <Trash2 className="w-4 h-4" />
          Limpiar Historial
        </Button>
      </div>

      {queries.length === 0 ? (
        <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
          <CardContent className="p-8">
            <div className="flex flex-col items-center justify-center text-center space-y-3">
              <AlertCircle className="w-12 h-12 text-gray-500" />
              <div>
                <h3 className="text-gray-300 font-semibold text-lg">No hay consultas guardadas</h3>
                <p className="text-gray-400 text-sm mt-1">Ejecuta una consulta ETL primero para ver gráficos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Selector de consulta */}
          <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Seleccionar Consulta</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {queries.map((query) => (
                  <div
                    key={query.id}
                    onClick={() => setSelectedQueryId(query.id)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedQueryId === query.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                    }`}
                  >
                    <div className="text-xs font-mono break-all">{query.query.substring(0, 80)}...</div>
                    <div className="text-xs text-gray-400 mt-1">
                      {query.connectionName} · {query.rows.length} filas
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Gráfico */}
          {chartData ? (
            <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Comparación lado a lado</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-slate-900 p-6 rounded-lg border border-slate-700" style={{ height: '500px' }}>
                  <Bar
                    data={chartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          display: true,
                          labels: {
                            color: '#9CA3AF',
                            font: { size: 12 },
                          },
                        },
                        tooltip: {
                          backgroundColor: '#1F2937',
                          borderColor: '#4B5563',
                          borderWidth: 1,
                          titleColor: '#FFFFFF',
                          bodyColor: '#D1D5DB',
                          padding: 12,
                        },
                      },
                      scales: {
                        x: {
                          stacked: false,
                          grid: { color: '#374151' },
                          ticks: { color: '#9CA3AF' },
                        },
                        y: {
                          stacked: false,
                          grid: { color: '#374151' },
                          ticks: { color: '#9CA3AF' },
                        },
                      },
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
              <CardContent className="p-8">
                <div className="flex flex-col items-center justify-center text-center space-y-3">
                  <AlertCircle className="w-12 h-12 text-gray-500" />
                  <div>
                    <h3 className="text-gray-300 font-semibold text-lg">No hay datos para visualizar</h3>
                    <p className="text-gray-400 text-sm mt-1">Selecciona una consulta para ver su gráfico comparativo</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
