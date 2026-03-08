'use client';

import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Bar, Line, Pie } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface QueryRecord {
  id: string;
  query: string;
  timestamp: string;
  columns: string[];
  rows: any[];
  isETL?: boolean;
  connectionName?: string;
  multiDBResults?: Record<string, any[]>;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: { color: '#E5E7EB', font: { size: 12 } },
      position: 'top' as const,
    },
    tooltip: {
      backgroundColor: '#1F2937',
      borderColor: '#4B5563',
      borderWidth: 1,
      titleColor: '#E5E7EB',
      bodyColor: '#E5E7EB',
      padding: 12,
    },
  },
  scales: {
    x: { ticks: { color: '#9CA3AF' }, grid: { color: '#374151' } },
    y: { ticks: { color: '#9CA3AF' }, grid: { color: '#374151' } },
  },
};

export function Graficas() {
  const chartRef = useRef<HTMLDivElement>(null);
  const [history, setHistory] = useState<QueryRecord[]>([]);
  const [selectedQuery, setSelectedQuery] = useState<QueryRecord | null>(null);
  const [chartType, setChartType] = useState<'bar' | 'line' | 'pie'>('bar');
  const [error, setError] = useState<string | null>(null);
  const [numericColumns, setNumericColumns] = useState<string[]>([]);
  const [selectedNumericColumns, setSelectedNumericColumns] = useState<string[]>([]);
  const [labelColumn, setLabelColumn] = useState<string>('');
  const [selectedDBsForComparison, setSelectedDBsForComparison] = useState<string[]>([]);
  const [showComparisonView, setShowComparisonView] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = () => {
    try {
      const sqlStored = localStorage.getItem('sqlHistory');
      let mainHistory: QueryRecord[] = [];
      if (sqlStored) {
        mainHistory = JSON.parse(sqlStored);
      }

      const etlStored = localStorage.getItem('etl_query_history');
      let etlHistory: QueryRecord[] = [];
      if (etlStored) {
        etlHistory = JSON.parse(etlStored).map((item: any) => ({
          id: item.id,
          query: item.query,
          rows: item.rows,
          columns: item.columns,
          timestamp: item.timestamp,
          isETL: true,
          connectionName: item.connectionName,
          multiDBResults: item.multiDBResults,
        }));
      }

      const combinedHistory = [...etlHistory, ...mainHistory].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      setHistory(combinedHistory);
    } catch (err) {
      console.error('Error loading history:', err);
    }
  };

  const handleQuerySelect = (query: QueryRecord) => {
    setSelectedQuery(query);
    generateChartFromQuery(query);
  };

  const isNumeric = (value: any): boolean => {
    if (typeof value === 'number') return true;
    if (typeof value === 'string') {
      const num = parseFloat(value);
      return !isNaN(num) && value.trim() !== '';
    }
    return false;
  };

  const generateChartFromQuery = (query: QueryRecord) => {
    setError(null);
    setShowComparisonView(false);

    if (query.rows.length === 0) {
      setError('La consulta no devolvió resultados');
      return;
    }

    const firstRow = query.rows[0];
    const columns = query.columns;

    if (columns.length === 0) {
      setError('La consulta no contiene columnas');
      return;
    }

    const numCols: string[] = [];
    const textCols: string[] = [];

    for (let col of columns) {
      const value = firstRow[col];
      if (isNumeric(value)) {
        numCols.push(col);
      } else {
        textCols.push(col);
      }
    }

    // Si no hay columnas de texto, usar la primera columna como etiqueta
    if (textCols.length === 0) {
      textCols.push(columns[0]);
    }

    if (numCols.length === 0) {
      setError('No se encontraron columnas numéricas en los datos');
      return;
    }

    setLabelColumn(textCols[0]);
    setNumericColumns(numCols);
    setSelectedNumericColumns([numCols[0]]);

    // Guardar todas las columnas de dimensión para uso posterior
    sessionStorage.setItem('dimensionColumns', JSON.stringify(textCols));

    if (query.multiDBResults && Object.keys(query.multiDBResults).length > 1) {
      setSelectedDBsForComparison(Object.keys(query.multiDBResults).slice(0, 2));
    }
  };

  const parseNumericValue = (value: any): number => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const num = parseFloat(value);
      return isNaN(num) ? 0 : num;
    }
    return 0;
  };

  const generateChartData = () => {
    if (!selectedQuery || selectedNumericColumns.length === 0) return null;

    // Obtener todas las columnas de dimensión almacenadas
    const dimensionCols = JSON.parse(sessionStorage.getItem('dimensionColumns') || '[]') as string[];
    
    // Si hay múltiples columnas de dimensión, combinarlas en una etiqueta
    const labels = selectedQuery.rows.map((row) => {
      if (dimensionCols.length > 1) {
        // Combinar múltiples dimensiones con " - "
        return dimensionCols.map(col => String(row[col] || 'N/A')).join(' - ');
      } else {
        return String(row[labelColumn] || 'N/A');
      }
    });

    const datasets = selectedNumericColumns.map((col, idx) => ({
      label: col,
      data: selectedQuery.rows.map((row) => parseNumericValue(row[col])),
      borderColor: COLORS[idx % COLORS.length],
      backgroundColor: COLORS[idx % COLORS.length],
      borderWidth: chartType === 'line' ? 2 : 0,
      fill: chartType === 'line' ? false : true,
      tension: 0.4,
    }));

    return { labels, datasets };
  };

  const generateComparisonData = () => {
    if (!selectedQuery || selectedDBsForComparison.length < 2 || !selectedQuery.multiDBResults) return null;

    const labelCol = labelColumn || selectedQuery.columns[0];
    const unifiedData: Record<string, any> = {};

    selectedDBsForComparison.forEach((dbName) => {
      const dbRows = selectedQuery.multiDBResults?.[dbName] || [];
      dbRows.forEach((row: any) => {
        const label = String(row[labelCol] ?? 'N/A');
        if (!unifiedData[label]) {
          unifiedData[label] = { name: label };
        }
        selectedNumericColumns.forEach((col) => {
          const value = parseNumericValue(row[col]);
          unifiedData[label][`${col}_${dbName}`] = value;
        });
      });
    });

    const labels = Object.keys(unifiedData);
    const datasets: any[] = [];
    let colorIdx = 0;

    selectedDBsForComparison.forEach((dbName) => {
      selectedNumericColumns.forEach((col) => {
        datasets.push({
          label: `${col} (${dbName})`,
          data: labels.map((label) => unifiedData[label][`${col}_${dbName}`] || 0),
          backgroundColor: COLORS[colorIdx % COLORS.length],
          borderColor: COLORS[colorIdx % COLORS.length],
          borderWidth: 1,
        });
        colorIdx++;
      });
    });

    return { labels, datasets };
  };

  const chartData = showComparisonView ? generateComparisonData() : generateChartData();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Selección de Consulta */}
        <div className="lg:col-span-1">
          <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white text-base">Consultas Guardadas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {history.length === 0 ? (
                <p className="text-gray-400 text-sm">No hay consultas en el historial</p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {history.map((query) => (
                    <div
                      key={query.id}
                      onClick={() => handleQuerySelect(query)}
                      className={`p-2 rounded-lg cursor-pointer transition-colors text-sm ${
                        selectedQuery?.id === query.id
                          ? query.isETL
                            ? 'bg-green-600 text-white'
                            : 'bg-blue-600 text-white'
                          : query.isETL
                          ? 'bg-green-900/30 border border-green-700 text-green-300 hover:bg-green-900/50'
                          : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {query.isETL && (
                          <span className="text-xs bg-green-700 text-white px-1.5 py-0.5 rounded">ETL</span>
                        )}
                        <code className="break-all text-xs flex-1">{query.query.substring(0, 50)}...</code>
                      </div>
                      <div className="text-xs text-gray-400 mt-1">{query.rows.length} filas</div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Opciones de Gráfico */}
        <div className="lg:col-span-3">
          {selectedQuery && (
            <>
              {/* Selector de Comparación */}
              {selectedQuery.multiDBResults && Object.keys(selectedQuery.multiDBResults).length > 1 && (
                <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 mb-6">
                  <CardHeader>
                    <CardTitle className="text-white text-sm">Comparación Multi-DB</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-4 flex-wrap">
                      {Object.keys(selectedQuery.multiDBResults).map((dbName) => (
                        <label key={dbName} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedDBsForComparison.includes(dbName)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedDBsForComparison([...selectedDBsForComparison, dbName]);
                              } else {
                                setSelectedDBsForComparison(selectedDBsForComparison.filter((d) => d !== dbName));
                              }
                            }}
                            className="w-4 h-4"
                          />
                          <span className="text-white text-sm">{dbName}</span>
                        </label>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => setShowComparisonView(false)}
                        className={`px-4 py-2 rounded text-sm ${
                          !showComparisonView
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                        }`}
                      >
                        Vista Normal
                      </Button>
                      <Button
                        onClick={() => setShowComparisonView(true)}
                        disabled={selectedDBsForComparison.length < 2}
                        className={`px-4 py-2 rounded text-sm ${
                          showComparisonView
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-700 text-gray-300 hover:bg-slate-600 disabled:opacity-50'
                        }`}
                      >
                        Comparación
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Opciones de Visualización */}
              <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white text-sm">Opciones de Visualización</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Tipo de Gráfico</label>
                    <select
                      value={chartType}
                      onChange={(e) => setChartType(e.target.value as 'bar' | 'line' | 'pie')}
                      className="w-full bg-slate-700 text-white border border-slate-600 rounded-lg p-2 text-sm"
                    >
                      <option value="bar">Barras</option>
                      <option value="line">Líneas</option>
                      <option value="pie">Pastel</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Columna de Etiquetas</label>
                    <select
                      value={labelColumn}
                      onChange={(e) => setLabelColumn(e.target.value)}
                      className="w-full bg-slate-700 text-white border border-slate-600 rounded-lg p-2 text-sm"
                    >
                      {selectedQuery.columns.map((col) => (
                        <option key={col} value={col}>
                          {col}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Columnas Numéricas</label>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {numericColumns.map((col) => (
                        <label key={col} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedNumericColumns.includes(col)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedNumericColumns([...selectedNumericColumns, col]);
                              } else {
                                setSelectedNumericColumns(selectedNumericColumns.filter((c) => c !== col));
                              }
                            }}
                            className="w-4 h-4"
                          />
                          <span className="text-white text-sm">{col}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>

      {/* Gráfico Principal */}
      {selectedQuery && (
        <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">
              {showComparisonView ? 'Comparación Multi-DB' : 'Gráfico de Datos'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div ref={chartRef} className="bg-slate-900 p-6 rounded-lg">
              {error ? (
                <div className="flex items-center gap-3 text-yellow-400 bg-yellow-900/20 border border-yellow-700 rounded p-4">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              ) : selectedNumericColumns.length === 0 ? (
                <div className="flex items-center gap-3 text-yellow-400 bg-yellow-900/20 border border-yellow-700 rounded p-4">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span>No hay columnas numéricas seleccionadas</span>
                </div>
              ) : !chartData ? (
                <div className="flex items-center gap-3 text-yellow-400 bg-yellow-900/20 border border-yellow-700 rounded p-4">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span>No hay datos disponibles</span>
                </div>
              ) : (
                <div style={{ position: 'relative', height: '400px' }}>
                  {chartType === 'pie' ? (
                    <Pie
                      data={chartData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            labels: { color: '#E5E7EB', font: { size: 12 } },
                            position: 'right',
                          },
                          tooltip: {
                            backgroundColor: '#1F2937',
                            borderColor: '#4B5563',
                            borderWidth: 1,
                            titleColor: '#E5E7EB',
                            bodyColor: '#E5E7EB',
                          },
                        },
                      }}
                    />
                  ) : chartType === 'line' ? (
                    <Line
                      data={chartData}
                      options={{
                        ...chartOptions,
                        plugins: {
                          ...chartOptions.plugins,
                          filler: { propagate: true },
                        },
                      }}
                    />
                  ) : (
                    <Bar data={chartData} options={chartOptions} />
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
