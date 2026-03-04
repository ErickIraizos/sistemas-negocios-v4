'use client';

import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ComposedChart,
  Treemap,
  Funnel,
  FunnelChart,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface QueryRecord {
  id: number;
  query: string;
  timestamp: string;
  columns: string[];
  rows: any[];
}

type ChartType = 'bar' | 'barh' | 'stacked-bar' | 'grouped-bar' | 'line' | 'multi-line' | 'pie' | 'area' | 'multi-area' | 'scatter' | 'radar' | 'composed' | 'treemap' | 'funnel' | 'heatmap';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

export function Graficas() {
  const chartRef = useRef<HTMLDivElement>(null);
  const [history, setHistory] = useState<QueryRecord[]>([]);
  const [selectedQuery, setSelectedQuery] = useState<QueryRecord | null>(null);
  const [chartType, setChartType] = useState<ChartType>('bar');
  const [chartData, setChartData] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [numericColumns, setNumericColumns] = useState<string[]>([]);
  const [selectedNumericColumns, setSelectedNumericColumns] = useState<string[]>([]);
  const [labelColumn, setLabelColumn] = useState<string>('');

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    // Regenerar datos cuando cambia el tipo de gráfica
    if (selectedQuery && selectedNumericColumns.length > 0) {
      generateChartData(selectedQuery, labelColumn, selectedNumericColumns);
    }
  }, [chartType]);

  const loadHistory = () => {
    // Cargar historial SQL principal
    const sqlStored = localStorage.getItem('sqlHistory');
    let mainHistory: QueryRecord[] = [];
    
    if (sqlStored) {
      mainHistory = JSON.parse(sqlStored);
    }

    // Cargar historial ETL (consultas en verde desde módulo ETL)
    const etlStored = localStorage.getItem('etl_query_history');
    let etlHistory: any[] = [];
    
    if (etlStored) {
      try {
        etlHistory = JSON.parse(etlStored).map((item: any) => ({
          id: item.id,
          query: item.query,
          rows: item.rows,
          columns: item.columns,
          timestamp: item.timestamp,
          isETL: true, // Marcar como ETL para visual en verde
        }));
      } catch (e) {
        console.error('Error loading ETL history:', e);
      }
    }

    // Combinar y ordenar por fecha (recientes primero)
    const combinedHistory = [...etlHistory, ...mainHistory].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    setHistory(combinedHistory);
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
    
    if (query.rows.length === 0) {
      setError('La consulta no devolvió resultados');
      setChartData([]);
      return;
    }

    const firstRow = query.rows[0];
    const columns = query.columns;

    if (columns.length === 0) {
      setError('La consulta no contiene columnas');
      setChartData([]);
      return;
    }

    // Detectar columnas numéricas y de texto
    const numCols: string[] = [];
    let textCol = '';

    for (let col of columns) {
      const value = firstRow[col];
      
      // Detectar columna de texto (no numérica)
      if (!textCol && !isNumeric(value)) {
        textCol = col;
      }
      
      // Detectar columna numérica
      if (isNumeric(value)) {
        numCols.push(col);
      }
    }

    // Si no hay columna de texto, usar la primera
    if (!textCol) {
      textCol = columns[0];
    }

    // Si no hay columnas numéricas, mostrar error
    if (numCols.length === 0) {
      setError('No se encontraron columnas numéricas en los datos');
      setChartData([]);
      return;
    }

    setLabelColumn(textCol);
    setNumericColumns(numCols);
    
    // Por defecto, seleccionar la primera columna numérica
    const defaultCols = [numCols[0]];
    setSelectedNumericColumns(defaultCols);
    
    generateChartData(query, textCol, defaultCols);
  };

  const parseNumericValue = (value: any): number => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const num = parseFloat(value);
      return isNaN(num) ? 0 : num;
    }
    return 0;
  };

  const generateChartData = (query: QueryRecord, labelCol: string, numCols: string[]) => {
    if (numCols.length === 0) {
      setError('No hay columnas numéricas disponibles');
      setChartData([]);
      return;
    }

    let data: any[];

    if (numCols.length === 1) {
      // Una sola columna numérica
      data = query.rows.map((row) => ({
        name: String(row[labelCol] ?? 'Sin valor'),
        value: parseNumericValue(row[numCols[0]]),
      }));
    } else {
      // Múltiples columnas numéricas
      data = query.rows.map((row) => {
        const obj: any = { name: String(row[labelCol] ?? 'Sin valor') };
        numCols.forEach((col) => {
          obj[col] = parseNumericValue(row[col]);
        });
        return obj;
      });
    }

    // Para gráficas de embudo, ordenar datos de mayor a menor
    if (chartType === 'funnel' && numCols.length === 1) {
      data = [...data].sort((a, b) => b.value - a.value);
    }

    setChartData(data);
    setError(null);
  };

  const handleChartTypeChange = (type: ChartType) => {
    setChartType(type);
  };

  const renderChart = () => {
    if (chartData.length === 0) return null;

    const isSingleMetric = selectedNumericColumns.length === 1;
    const metricKey = selectedNumericColumns[0] || 'value';

    switch (chartType) {
      case 'bar':
        return isSingleMetric ? (
          <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis type="number" stroke="#9CA3AF" />
            <YAxis dataKey="name" type="category" stroke="#9CA3AF" width={100} />
            <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #4B5563', borderRadius: '8px' }} />
            <Bar dataKey={metricKey} fill="#3B82F6" radius={[0, 8, 8, 0]} />
          </BarChart>
        ) : (
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="name" stroke="#9CA3AF" angle={-45} textAnchor="end" height={100} />
            <YAxis stroke="#9CA3AF" />
            <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #4B5563', borderRadius: '8px' }} />
            <Legend />
            {selectedNumericColumns.map((col, idx) => (
              <Bar key={col} dataKey={col} fill={COLORS[idx % COLORS.length]} radius={[8, 8, 0, 0]} />
            ))}
          </BarChart>
        );

      case 'stacked-bar':
        return (
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="name" stroke="#9CA3AF" angle={-45} textAnchor="end" height={100} />
            <YAxis stroke="#9CA3AF" />
            <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #4B5563', borderRadius: '8px' }} />
            <Legend />
            {selectedNumericColumns.map((col, idx) => (
              <Bar key={col} dataKey={col} stackId="a" fill={COLORS[idx % COLORS.length]} radius={[8, 8, 0, 0]} />
            ))}
          </BarChart>
        );

      case 'grouped-bar':
        return (
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="name" stroke="#9CA3AF" angle={-45} textAnchor="end" height={100} />
            <YAxis stroke="#9CA3AF" />
            <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #4B5563', borderRadius: '8px' }} />
            <Legend />
            {selectedNumericColumns.map((col, idx) => (
              <Bar key={col} dataKey={col} fill={COLORS[idx % COLORS.length]} radius={[8, 8, 0, 0]} />
            ))}
          </BarChart>
        );

      case 'barh':
        return isSingleMetric ? (
          <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 120, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis type="number" stroke="#9CA3AF" />
            <YAxis dataKey="name" type="category" stroke="#9CA3AF" />
            <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #4B5563', borderRadius: '8px' }} />
            <Bar dataKey={metricKey} fill="#10B981" radius={[0, 8, 8, 0]} />
          </BarChart>
        ) : null;

      case 'line':
        return (
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="name" stroke="#9CA3AF" />
            <YAxis stroke="#9CA3AF" />
            <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #4B5563', borderRadius: '8px' }} />
            <Legend />
            <Line type="monotone" dataKey={metricKey} stroke="#10B981" strokeWidth={2} dot={{ fill: '#10B981' }} />
          </LineChart>
        );

      case 'multi-line':
        return (
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="name" stroke="#9CA3AF" />
            <YAxis stroke="#9CA3AF" />
            <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #4B5563', borderRadius: '8px' }} />
            <Legend />
            {selectedNumericColumns.map((col, idx) => (
              <Line key={col} type="monotone" dataKey={col} stroke={COLORS[idx % COLORS.length]} strokeWidth={2} dot={{ fill: COLORS[idx % COLORS.length] }} />
            ))}
          </LineChart>
        );

      case 'area':
        return (
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="name" stroke="#9CA3AF" />
            <YAxis stroke="#9CA3AF" />
            <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #4B5563', borderRadius: '8px' }} />
            <Legend />
            <Area type="monotone" dataKey={metricKey} fill="#8B5CF6" stroke="#8B5CF6" />
          </AreaChart>
        );

      case 'multi-area':
        return (
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="name" stroke="#9CA3AF" />
            <YAxis stroke="#9CA3AF" />
            <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #4B5563', borderRadius: '8px' }} />
            <Legend />
            {selectedNumericColumns.map((col, idx) => (
              <Area key={col} type="monotone" dataKey={col} fill={COLORS[idx % COLORS.length]} stroke={COLORS[idx % COLORS.length]} fillOpacity={0.6} />
            ))}
          </AreaChart>
        );

      case 'pie':
        return (
          <PieChart>
            <Pie data={chartData} dataKey={metricKey} nameKey="name" cx="50%" cy="50%" outerRadius={120} label>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #4B5563', borderRadius: '8px' }} />
          </PieChart>
        );

      case 'scatter':
        return (
          <ScatterChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="name" stroke="#9CA3AF" />
            <YAxis dataKey={metricKey} stroke="#9CA3AF" />
            <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #4B5563', borderRadius: '8px' }} />
            <Scatter name="Valores" dataKey={metricKey} fill="#EC4899" />
          </ScatterChart>
        );

      case 'radar':
        return (
          <RadarChart data={chartData}>
            <PolarGrid stroke="#374151" />
            <PolarAngleAxis dataKey="name" stroke="#9CA3AF" />
            <PolarRadiusAxis stroke="#9CA3AF" />
            {selectedNumericColumns.length === 1 ? (
              <Radar name={metricKey} dataKey={metricKey} stroke="#14B8A6" fill="#14B8A6" fillOpacity={0.6} />
            ) : (
              selectedNumericColumns.map((col, idx) => (
                <Radar key={col} name={col} dataKey={col} stroke={COLORS[idx % COLORS.length]} fill={COLORS[idx % COLORS.length]} fillOpacity={0.4} />
              ))
            )}
            <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #4B5563', borderRadius: '8px' }} />
            <Legend />
          </RadarChart>
        );

      case 'composed':
        return (
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="name" stroke="#9CA3AF" />
            <YAxis stroke="#9CA3AF" />
            <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #4B5563', borderRadius: '8px' }} />
            <Legend />
            {selectedNumericColumns.slice(0, 1).map((col, idx) => (
              <Bar key={col} dataKey={col} fill={COLORS[idx % COLORS.length]} radius={[8, 8, 0, 0]} />
            ))}
            {selectedNumericColumns.slice(1).map((col, idx) => (
              <Line key={col} type="monotone" dataKey={col} stroke={COLORS[(idx + 1) % COLORS.length]} strokeWidth={2} />
            ))}
          </ComposedChart>
        );

      case 'treemap':
        return (
          <Treemap data={chartData} dataKey={metricKey} nameKey="name" stroke="#8884d8" fill="#3B82F6" content={<CustomTreemapContent />} />
        );

      case 'funnel':
        return (
          <FunnelChart width={730} height={400}>
            <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #4B5563', borderRadius: '8px' }} />
            <Funnel dataKey={metricKey} data={chartData} fill="#3B82F6" shape="linear">
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Funnel>
          </FunnelChart>
        );

      case 'heatmap':
        return <HeatmapChart data={chartData} />;

      default:
        return null;
    }
  };

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
                  {history.map((query: any) => (
                    <div
                      key={query.id}
                      onClick={() => handleQuerySelect(query)}
                      className={`p-2 rounded-lg cursor-pointer transition-colors text-sm ${
                        selectedQuery?.id === query.id
                          ? query.isETL ? 'bg-green-600 text-white' : 'bg-blue-600 text-white'
                          : query.isETL ? 'bg-green-900/30 border border-green-700 text-green-300 hover:bg-green-900/50' : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
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

        {/* Configuración de Gráfica */}
        {selectedQuery && (
          <div className="lg:col-span-3 space-y-4">
            {/* Selector de Columnas Numéricas */}
            {numericColumns.length > 1 && (
              <Card className="bg-gradient-to-br from-amber-900/20 to-orange-900/20 border border-amber-700/50">
                <CardHeader>
                  <CardTitle className="text-amber-200 text-base">Selecciona Columnas a Visualizar</CardTitle>
                  <p className="text-amber-100/70 text-xs mt-2">Tu consulta devolvió múltiples métricas. Elige cuáles deseas mostrar.</p>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {numericColumns.map((col) => (
                      <button
                        key={col}
                        onClick={() => {
                          const newCols = selectedNumericColumns.includes(col)
                            ? selectedNumericColumns.filter((c) => c !== col)
                            : [...selectedNumericColumns, col];
                          if (newCols.length > 0) {
                            setSelectedNumericColumns(newCols);
                            generateChartData(selectedQuery, labelColumn, newCols);
                          }
                        }}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          selectedNumericColumns.includes(col)
                            ? 'bg-amber-600 text-white'
                            : 'bg-amber-900/40 text-amber-200 hover:bg-amber-900/60'
                        }`}
                      >
                        {col}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Selector de Tipo de Gráfica */}
            <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white text-base">Tipo de Visualización</CardTitle>
                <p className="text-gray-400 text-xs mt-2">
                  {selectedNumericColumns.length > 1 
                    ? 'Gráficas para múltiples series de datos'
                    : 'Elige según tu objetivo'}
                </p>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 flex-wrap">
                  {(selectedNumericColumns.length > 1 
                    ? ['stacked-bar', 'grouped-bar', 'multi-line', 'multi-area', 'composed', 'radar']
                    : ['bar', 'barh', 'line', 'pie', 'area', 'scatter', 'radar', 'composed', 'treemap', 'funnel', 'heatmap']
                  ).map((type) => {
                    const labels: Record<string, string> = {
                      bar: 'Barras',
                      barh: 'Barras H',
                      'stacked-bar': 'Apiladas',
                      'grouped-bar': 'Agrupadas',
                      line: 'Línea',
                      'multi-line': 'Múltiples',
                      pie: 'Pastel',
                      area: 'Área',
                      'multi-area': 'Múltiples Áreas',
                      scatter: 'Dispersión',
                      radar: 'Radar',
                      composed: 'Compuesta',
                      treemap: 'Árbol',
                      funnel: 'Embudo',
                      heatmap: 'Calor',
                    };
                    return (
                      <Button
                        key={type}
                        onClick={() => handleChartTypeChange(type as ChartType)}
                        className={`text-sm px-3 py-1.5 transition-all ${
                          chartType === type
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/50'
                            : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                        }`}
                      >
                        {labels[type]}
                      </Button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <Card className="bg-red-900/20 border border-red-700 col-span-full">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-red-400 font-semibold">No se puede generar la gráfica</p>
                <p className="text-red-300 text-sm mt-1">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Gráfica */}
      {chartData.length > 0 && selectedQuery && !error && (
        <div className="space-y-6">
          <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Visualización de Datos</CardTitle>
            </CardHeader>
            <CardContent>
              <div ref={chartRef} className="bg-slate-900 p-6 rounded-lg">
                <ResponsiveContainer width="100%" height={400}>
                  {renderChart()}
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Informe Detallado para Toma de Decisiones */}
          <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Informe Ejecutivo - Toma de Decisiones</CardTitle>
              <p className="text-gray-400 text-xs mt-2">Análisis detallado con recomendaciones estratégicas</p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* KPIs Principales */}
              <div>
                <h4 className="text-sm font-bold text-white mb-4">KPIs Principales</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {generateKPIs(chartData, selectedNumericColumns).map((kpi, idx) => (
                    <div key={idx} className="bg-slate-700 rounded-lg p-3 border border-slate-600">
                      <p className="text-gray-400 text-xs">{kpi.label}</p>
                      <p className={`text-lg font-bold mt-1 ${kpi.color}`}>{kpi.value}</p>
                      <p className="text-xs text-gray-500 mt-1">{kpi.trend}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Análisis Comparativo */}
              <div>
                <h4 className="text-sm font-bold text-white mb-4">Análisis Comparativo</h4>
                <div className="bg-slate-700 rounded-lg p-4 border border-slate-600 space-y-2">
                  {generateComparativeAnalysis(chartData, selectedNumericColumns).map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm">
                      <span className="text-gray-300">{item.label}</span>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-600 rounded h-2 w-32">
                          <div className="bg-blue-500 h-full rounded" style={{ width: `${item.percentage}%` }}></div>
                        </div>
                        <span className="text-blue-400 font-bold w-20 text-right">{item.value}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recomendaciones Estratégicas */}
              <div>
                <h4 className="text-sm font-bold text-white mb-4">Recomendaciones Estratégicas</h4>
                <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4 space-y-2">
                  {generateStrategicRecommendations(chartData, selectedNumericColumns, chartType).map((rec, idx) => (
                    <div key={idx} className="flex gap-3">
                      <span className="text-blue-400 font-bold text-lg">{idx + 1}.</span>
                      <p className="text-sm text-gray-300">{rec}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Insights Clave */}
              <div>
                <h4 className="text-sm font-bold text-white mb-4">Insights Clave</h4>
                <div className="space-y-3">
                  {generateKeyInsights(chartData, selectedNumericColumns, chartType).map((insight, idx) => (
                    <div key={idx} className="bg-slate-700 rounded-lg p-3 border-l-4 border-blue-500">
                      <p className="text-sm font-semibold text-blue-300">{insight.title}</p>
                      <p className="text-xs text-gray-300 mt-1">{insight.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Métodos Consultados */}
              <div>
                <h4 className="text-sm font-bold text-white mb-3">Información de la Consulta</h4>
                <div className="bg-slate-700 rounded-lg p-3 border border-slate-600">
                  <code className="text-xs text-gray-300 break-all leading-relaxed">{selectedQuery.query}</code>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// Funciones auxiliares para el informe
const generateKPIs = (data: any[], metrics: string[]) => {
  const kpis = [];
  
  metrics.forEach((metric, idx) => {
    const values = data.map((d) => d[metric] || 0);
    const total = values.reduce((a, b) => a + b, 0);
    const avg = total / values.length;
    const max = Math.max(...values);

    kpis.push({
      label: `${metric} - Total`,
      value: total.toLocaleString('es-ES'),
      color: 'text-blue-400',
      trend: `+${((max / avg - 1) * 100).toFixed(1)}% vs promedio`,
    });
  });

  return kpis.slice(0, 4);
};

const generateComparativeAnalysis = (data: any[], metrics: string[]) => {
  if (data.length === 0) return [];
  
  // Encontrar el elemento con mayor valor
  let maxTotal = 0;
  let maxIndex = 0;
  
  data.forEach((item, idx) => {
    const total = metrics.reduce((sum, metric) => sum + (item[metric] || 0), 0);
    if (total > maxTotal) {
      maxTotal = total;
      maxIndex = idx;
    }
  });

  return data.map((item, idx) => {
    const total = metrics.reduce((sum, metric) => sum + (item[metric] || 0), 0);
    return {
      label: item.name,
      value: total.toLocaleString('es-ES'),
      percentage: maxTotal > 0 ? (total / maxTotal) * 100 : 0,
    };
  });
};

const generateStrategicRecommendations = (data: any[], metrics: string[], chartType: ChartType) => {
  const recommendations = [];

  if (data.length > 0) {
    const totals = data.map((d) => 
      metrics.reduce((sum, m) => sum + (d[m] || 0), 0)
    );
    const maxVal = Math.max(...totals);
    const minVal = Math.min(...totals);
    const avgVal = totals.reduce((a, b) => a + b, 0) / totals.length;

    recommendations.push(
      `Enfoque en ${data[totals.indexOf(maxVal)]?.name} que lidera con ${maxVal.toLocaleString('es-ES')} unidades. Replicar estrategias exitosas.`
    );

    if (minVal < avgVal / 2) {
      recommendations.push(
        `${data[totals.indexOf(minVal)]?.name} muestra bajo desempeño (${minVal.toLocaleString('es-ES')}). Requiere intervención urgente.`
      );
    }

    if (metrics.length > 1) {
      recommendations.push(
        `Analizar correlación entre métricas. Optimizar asignación de recursos basado en ROI por métrica.`
      );
    }
  }

  if (chartType === 'funnel') {
    recommendations.push('Identificar y eliminar cuellos de botella en el embudo de conversión.');
  }

  return recommendations;
};

const generateKeyInsights = (data: any[], metrics: string[], chartType: ChartType) => {
  const insights = [];

  if (data.length > 0 && metrics.length > 0) {
    const totals = data.map((d) => metrics.reduce((sum, m) => sum + (d[m] || 0), 0));
    const variance = calculateVariance(totals);
    const cv = calculateCoefficientOfVariation(totals);

    if (cv > 50) {
      insights.push({
        title: 'Alta Variabilidad Detectada',
        description: `Los datos muestran variabilidad alta (CV: ${cv.toFixed(1)}%). Investiga las causas de estas diferencias significativas.`,
      });
    }

    if (data.length >= 3) {
      const sorted = [...data].sort((a, b) => 
        (b[metrics[0]] || 0) - (a[metrics[0]] || 0)
      );
      insights.push({
        title: 'Top Performer',
        description: `${sorted[0]?.name} sobresale significativamente. Considera esto un case de éxito a replicar.`,
      });
    }
  }

  if (metrics.length > 1) {
    insights.push({
      title: 'Múltiples Métricas Analizadas',
      description: 'Estás evaluando varios indicadores simultáneamente. Busca sinergias entre ellos.',
    });
  }

  return insights;
};

const calculateVariance = (values: number[]) => {
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  return values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
};

const calculateCoefficientOfVariation = (values: number[]) => {
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = calculateVariance(values);
  const sd = Math.sqrt(variance);
  return mean !== 0 ? (sd / mean) * 100 : 0;
};

const HeatmapChart = ({ data }: { data: any[] }) => {
  if (data.length < 4) {
    return (
      <div className="text-center text-gray-400">
        <p>Se necesitan más datos para un heatmap</p>
        <p className="text-xs mt-2">Mínimo 4 registros recomendado</p>
      </div>
    );
  }

  const maxValue = Math.max(...data.map((d) => d.value));
  const minValue = Math.min(...data.map((d) => d.value));
  
  return (
    <div className="w-full overflow-x-auto">
      <div className="flex gap-1 p-4">
        <div className="flex flex-col gap-1 pr-4">
          {data.map((item, idx) => (
            <div key={`label-${idx}`} className="h-8 flex items-center text-xs text-gray-300 w-32 text-right pr-2">
              {item.name}
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-1">
          {data.map((item, idx) => {
            const intensity = ((item.value - minValue) / (maxValue - minValue)) * 255;
            
            return (
              <div
                key={`cell-${idx}`}
                className="h-8 px-4 flex items-center justify-center rounded text-xs font-bold text-white transition-all hover:scale-105 cursor-pointer"
                style={{
                  backgroundColor: `rgb(${Math.floor(intensity * 0.5)}, ${Math.floor(100 + intensity * 0.5)}, 255)`,
                  minWidth: '80px',
                }}
                title={`${item.name}: ${item.value}`}
              >
                {item.value.toLocaleString('es-ES')}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const CustomTreemapContent = (props: any) => {
  const { x, y, width, height, name, value } = props;

  return (
    <g>
      <rect x={x} y={y} width={width} height={height} style={{ fill: '#3B82F6', stroke: '#1F2937', strokeWidth: 2 }} />
      <text x={x + width / 2} y={y + height / 2 - 7} textAnchor="middle" fill="#fff" fontSize={14} fontWeight="bold">
        {name}
      </text>
      <text x={x + width / 2} y={y + height / 2 + 7} textAnchor="middle" fill="#fff" fontSize={12}>
        {value}
      </text>
    </g>
  );
};
