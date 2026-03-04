'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, Trash2, RefreshCw } from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function GraficasVsPage() {
  const [queries, setQueries] = useState<any[]>([]);
  const [selectedQueryId, setSelectedQueryId] = useState<string | null>(null);
  const [chartData, setChartData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Definir loadQueries antes de usarla
  const loadQueries = () => {
    const savedQueries = localStorage.getItem('etl_query_history');
    if (savedQueries) {
      try {
        const parsedQueries = JSON.parse(savedQueries);
        const etlQueries = parsedQueries.filter((q: any) => q.isETL && q.multiDBResults && Object.keys(q.multiDBResults).length > 0);
        setQueries(etlQueries);
        if (etlQueries.length > 0 && !selectedQueryId) {
          setSelectedQueryId(etlQueries[0].id);
        }
      } catch (error) {
        console.error('Error parsing queries:', error);
      }
    }
    setLoading(false);
  };

  // Definir clearHistory antes de usarla
  const clearHistory = () => {
    if (window.confirm('¿Estás seguro de que deseas eliminar todo el historial de ETL? Esta acción no se puede deshacer.')) {
      localStorage.removeItem('etl_query_history');
      setQueries([]);
      setSelectedQueryId(null);
      setChartData(null);
    }
  };

  // Cargar consultas ETL guardadas
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

    // Procesar datos para Chart.js
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

    const labels: string[] = [];
    const datasets: any[] = [];
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
    const dbNames = Object.keys(selected.multiDBResults);

    // Construir datos para cada métrica y DB
    dbNames.forEach((dbName, dbIdx) => {
      numericCols.forEach((col: string, colIdx: number) => {
        const dbResult = selected.multiDBResults[dbName];
        if (!Array.isArray(dbResult)) return;

        const data = dbResult.map((row: any) => Number(row[col]) || 0);
        const rowLabels = dbResult.map((row: any) => String(row[labelCol] || 'N/A'));

        // Agregar labels únicos
        rowLabels.forEach((label: string) => {
          if (!labels.includes(label)) {
            labels.push(label);
          }
        });

        datasets.push({
          label: `${col} (${dbName})`,
          data: rowLabels.map((_, idx) => data[idx] || 0),
          backgroundColor: colors[(dbIdx * numericCols.length + colIdx) % colors.length],
          borderColor: colors[(dbIdx * numericCols.length + colIdx) % colors.length],
          borderWidth: 1,
          borderRadius: 4,
        });
      });
    });

    setChartData({
      labels,
      datasets,
    });
  }, [selectedQueryId, queries]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-400">Cargando...</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-white">Gráficas vs - Comparación ETL</h1>
          <p className="text-gray-400">Visualiza comparaciones lado a lado entre bases de datos</p>
        </div>

        {queries.length === 0 ? (
          <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
            <CardContent className="p-8">
              <div className="flex flex-col items-center justify-center text-center space-y-3">
                <AlertCircle className="w-12 h-12 text-gray-500" />
                <div>
                  <h3 className="text-gray-300 font-semibold text-lg">Sin consultas ETL guardadas</h3>
                  <p className="text-gray-400 text-sm mt-1">Ejecuta consultas en la sección ETL para verlas aquí</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Selector de Consulta */}
            <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Seleccionar Consulta</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {queries.map((query) => (
                    <button
                      key={query.id}
                      onClick={() => setSelectedQueryId(query.id)}
                      className={`w-full p-3 rounded-lg text-left transition-colors ${
                        selectedQueryId === query.id
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-sm truncate">{query.query.substring(0, 60)}...</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {query.connectionName} • {query.rows.length} filas • {Object.keys(query.multiDBResults || {}).length} DBs
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Botones de Acción */}
                <div className="flex gap-2 pt-4 border-t border-slate-600">
                  <Button
                    onClick={() => loadQueries()}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Recargar
                  </Button>
                  <Button
                    onClick={clearHistory}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Limpiar Historial
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Gráfico */}
            {chartData ? (
              <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Gráfico Comparativo</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-slate-900 p-6 rounded-lg">
                    <div style={{ position: 'relative', height: '400px' }}>
                      <Bar
                        data={chartData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              position: 'top',
                              labels: {
                                color: '#D1D5DB',
                                font: { size: 12 },
                              },
                            },
                            tooltip: {
                              backgroundColor: 'rgba(31, 41, 55, 0.9)',
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
                              grid: { color: 'rgba(107, 114, 128, 0.1)' },
                              ticks: { color: '#9CA3AF' },
                            },
                            y: {
                              stacked: false,
                              grid: { color: 'rgba(107, 114, 128, 0.1)' },
                              ticks: { color: '#9CA3AF' },
                            },
                          },
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
                <CardContent className="p-8">
                  <div className="flex flex-col items-center justify-center text-center space-y-3">
                    <AlertCircle className="w-12 h-12 text-gray-500" />
                    <div>
                      <h3 className="text-gray-300 font-semibold text-lg">Sin datos para mostrar</h3>
                      <p className="text-gray-400 text-sm mt-1">Selecciona una consulta con datos numéricos</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
