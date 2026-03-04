'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function GraficasVsPage() {
  const [queries, setQueries] = useState<any[]>([]);
  const [selectedQueryId, setSelectedQueryId] = useState<string | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Cargar consultas ETL guardadas
  useEffect(() => {
    const savedQueries = localStorage.getItem('etl_query_history');
    if (savedQueries) {
      try {
        const parsedQueries = JSON.parse(savedQueries);
        // Filtrar solo consultas ETL (que tienen múltiples DBs)
        const etlQueries = parsedQueries.filter((q: any) => q.isETL && q.multiDBResults && Object.keys(q.multiDBResults).length > 1);
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

  // Procesar datos cuando se selecciona una consulta
  useEffect(() => {
    if (!selectedQueryId) return;

    const selected = queries.find((q) => q.id === selectedQueryId);
    if (!selected || !selected.multiDBResults) return;

    // Combinar datos de múltiples DBs para comparación lado a lado
    const labelCol = selected.columns?.[0] || 'name';
    const numericCols = selected.columns?.filter((col: string) => {
      const val = Object.values(selected.multiDBResults)[0]?.[0]?.[col];
      return val !== null && val !== undefined && !isNaN(Number(val));
    }) || [];

    if (numericCols.length === 0) return;

    const unifiedData: Record<string, any> = {};
    const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

    // Iterar sobre cada DB
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

    setChartData(Object.values(unifiedData));
  }, [selectedQueryId, queries]);

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-gray-400">Cargando gráficos comparativos...</div>
      </div>
    );
  }

  if (queries.length === 0) {
    return (
      <div className="p-8">
        <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
          <CardContent className="p-8">
            <div className="flex flex-col items-center justify-center text-center space-y-3">
              <AlertCircle className="w-12 h-12 text-gray-500" />
              <div>
                <h3 className="text-gray-300 font-semibold text-lg">No hay consultas ETL guardadas</h3>
                <p className="text-gray-400 text-sm mt-1">Ejecuta una consulta ETL en la sección de transformación para ver gráficos comparativos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const selectedQuery = queries.find((q) => q.id === selectedQueryId);
  const numericCols = selectedQuery?.columns?.filter((col: string) => {
    const val = Object.values(selectedQuery.multiDBResults)?.[0]?.[0]?.[col];
    return val !== null && val !== undefined && !isNaN(Number(val));
  }) || [];
  const dbNames = selectedQuery ? Object.keys(selectedQuery.multiDBResults) : [];
  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  return (
    <div className="p-8 space-y-6">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold text-white">Gráficas vs - Comparación ETL</h1>
        <p className="text-gray-400">Visualiza comparaciones lado a lado entre bases de datos</p>
      </div>

      {/* Selector de Consulta */}
      <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Seleccionar Consulta</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-96 overflow-y-auto">
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
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs bg-green-700 text-white px-1.5 py-0.5 rounded">ETL</span>
                  <code className="text-xs break-all">{query.query.substring(0, 60)}...</code>
                </div>
                <div className="text-xs text-gray-400">
                  {dbNames.join(' vs ')} • {query.rows?.length || 0} filas
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Gráfico Comparativo */}
      {selectedQuery && chartData.length > 0 && (
        <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Comparación Lado a Lado</CardTitle>
            <p className="text-gray-400 text-xs mt-2">
              {dbNames.join(' vs ')}
            </p>
          </CardHeader>
          <CardContent>
            <div className="bg-slate-900 p-6 rounded-lg border border-slate-700">
              <ResponsiveContainer width="100%" height={500}>
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 80, bottom: 150 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis
                    dataKey="name"
                    stroke="#9CA3AF"
                    angle={-45}
                    textAnchor="end"
                    height={150}
                    interval={0}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis stroke="#9CA3AF" width={60} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #4B5563', borderRadius: '8px' }}
                    formatter={(value: any) => value.toLocaleString('es-ES')}
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  {numericCols.map((col: string, idx: number) =>
                    dbNames.map((dbName, dbIdx) => (
                      <Bar
                        key={`${col}_${dbName}`}
                        dataKey={`${col}_${dbName}`}
                        name={`${col} (${dbName})`}
                        fill={COLORS[(idx * dbNames.length + dbIdx) % COLORS.length]}
                        radius={[8, 8, 0, 0]}
                      />
                    ))
                  )}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabla Detallada */}
      {selectedQuery && chartData.length > 0 && (
        <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Tabla Detallada</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr>
                    <th className="bg-slate-700 p-2 text-left text-gray-300">{selectedQuery.columns?.[0] || 'Elemento'}</th>
                    {dbNames.map((dbName) => (
                      <th
                        key={dbName}
                        colSpan={Math.max(1, (selectedQuery.columns?.length || 1) - 1)}
                        className="bg-slate-700 p-2 text-center text-gray-300"
                      >
                        {dbName}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {chartData.map((item, idx) => (
                    <tr key={idx}>
                      <td className="bg-slate-800 p-2 text-gray-300 border border-slate-700 font-semibold">
                        {item.name}
                      </td>
                      {dbNames.map((dbName) => (
                        <td key={dbName} className="bg-slate-800 p-2 border border-slate-700">
                          <div className="space-y-1">
                            {numericCols.map((col: string) => (
                              <div key={col} className="text-gray-300">
                                <span className="text-gray-400 text-xs">{col}:</span>{' '}
                                <span className="text-gray-200 font-semibold">
                                  {(item[`${col}_${dbName}`] || 0).toLocaleString('es-ES')}
                                </span>
                              </div>
                            ))}
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
