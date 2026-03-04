'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, RotateCcw, Trash2 } from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

interface ETLQuery {
  id: string;
  query: string;
  rows: any[];
  columns: string[];
  timestamp: string;
  connectionId: string;
  connectionName: string;
  isETL: boolean;
  multiDBResults: Record<string, any>;
  selectedConnections: string[];
}

export default function GraficasVsPage() {
  const [queries, setQueries] = useState<ETLQuery[]>([]);
  const [selectedQueryId, setSelectedQueryId] = useState<string | null>(null);
  const [chartData, setChartData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('etl_query_history');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const etlQueries = parsed.filter(
          (q: any) => q.isETL && q.multiDBResults && Object.keys(q.multiDBResults).length > 0
        );
        setQueries(etlQueries);
        if (etlQueries.length > 0) {
          setSelectedQueryId(etlQueries[0].id);
        }
      } catch (error) {
        console.error('Error parsing queries:', error);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!selectedQueryId || queries.length === 0) {
      setChartData(null);
      return;
    }

    const selected = queries.find((q) => q.id === selectedQueryId) as ETLQuery | undefined;
    if (!selected || !selected.multiDBResults) {
      setChartData(null);
      return;
    }

    try {
      const labelCol = selected.columns?.[0] || 'name';
      const dbNames = Object.keys(selected.multiDBResults);

      const numericCols = selected.columns?.filter((col: string) => {
        const firstDb = selected.multiDBResults[dbNames[0]];
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

      const datasets = numericCols.flatMap((col: string, colIdx: number) =>
        dbNames.map((dbName, dbIdx) => ({
          label: `${col} (${dbName})`,
          data: finalData.map((item) => item[`${col}_${dbName}`] || 0),
          backgroundColor: COLORS[(colIdx * dbNames.length + dbIdx) % COLORS.length],
          borderColor: COLORS[(colIdx * dbNames.length + dbIdx) % COLORS.length],
          borderWidth: 1,
          borderRadius: 4,
        }))
      );

      setChartData({
        labels: finalData.map((item) => item.name),
        datasets,
      });
    } catch (error) {
      console.error('Error generating chart:', error);
      setChartData(null);
    }
  }, [selectedQueryId, queries]);

  const handleReload = () => {
    const saved = localStorage.getItem('etl_query_history');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const etlQueries = parsed.filter(
          (q: any) => q.isETL && q.multiDBResults && Object.keys(q.multiDBResults).length > 0
        );
        setQueries(etlQueries);
        if (etlQueries.length > 0) {
          setSelectedQueryId(etlQueries[0].id);
        }
      } catch (error) {
        console.error('Error reloading:', error);
      }
    }
  };

  const handleClearHistory = () => {
    if (window.confirm('¿Estás seguro de que deseas eliminar todo el historial?')) {
      localStorage.removeItem('etl_query_history');
      setQueries([]);
      setSelectedQueryId(null);
      setChartData(null);
    }
  };

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

      <div className="flex gap-2">
        <Button onClick={handleReload} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
          <RotateCcw className="w-4 h-4" />
          Recargar
        </Button>
        <Button onClick={handleClearHistory} className="bg-red-600 hover:bg-red-700 text-white gap-2">
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
                <p className="text-gray-400 text-sm mt-1">Ejecuta una consulta ETL para ver gráficos comparativos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
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
                      {query.connectionName} • {query.rows.length} filas • {Object.keys(query.multiDBResults).length} DBs
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

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
                          callbacks: {
                            label: function(context: any) {
                              let label = context.dataset.label || '';
                              if (label) label += ': ';
                              if (context.parsed.y !== null) {
                                label += context.parsed.y.toLocaleString('es-ES');
                              }
                              return label;
                            }
                          }
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
