'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, RotateCcw, Trash2 } from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function GraficasVsPage() {
  const [queries, setQueries] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [chart, setChart] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadData = () => {
    try {
      const saved = localStorage.getItem('etl_query_history');
      if (saved) {
        const data = JSON.parse(saved).filter((q: any) => q.isETL && q.multiDBResults && Object.keys(q.multiDBResults).length > 0);
        setQueries(data);
        if (data.length > 0 && !selectedId) {
          setSelectedId(data[0].id);
        }
      }
    } catch (e) {
      console.error('Error loading:', e);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!selectedId || !queries.length) {
      setChart(null);
      return;
    }

    const q = queries.find(x => x.id === selectedId);
    if (!q || !q.multiDBResults) {
      setChart(null);
      return;
    }

    try {
      const col1 = q.columns?.[0] || 'name';
      const dbs = Object.keys(q.multiDBResults);
      const numCols = q.columns?.filter((c: string) => {
        const db = q.multiDBResults[dbs[0]];
        if (db?.rows?.[0]) {
          const v = db.rows[0][c];
          return v !== null && !isNaN(Number(v));
        }
        return false;
      }) || [];

      if (!numCols.length) {
        setChart(null);
        return;
      }

      const map: Record<string, any> = {};
      Object.entries(q.multiDBResults).forEach(([db, res]: [string, any]) => {
        if (res?.rows) {
          res.rows.forEach((row: any) => {
            const label = String(row[col1] ?? 'N/A');
            if (!map[label]) map[label] = { name: label };
            numCols.forEach((c: string) => {
              map[label][`${c}_${db}`] = Number(row[c]) || 0;
            });
          });
        }
      });

      const items = Object.values(map);
      if (!items.length) {
        setChart(null);
        return;
      }

      const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
      const sets = numCols.flatMap((c: string, i: number) =>
        dbs.map((d, j) => ({
          label: `${c} (${d})`,
          data: items.map(x => x[`${c}_${d}`] || 0),
          backgroundColor: colors[(i * dbs.length + j) % colors.length],
          borderWidth: 0,
        }))
      );

      setChart({
        labels: items.map(x => x.name),
        datasets: sets,
      });
    } catch (e) {
      console.error('Error chart:', e);
      setChart(null);
    }
  }, [selectedId, queries]);

  if (loading) return <div className="p-8 text-gray-400">Cargando...</div>;

  return (
    <div className="space-y-6 p-8">
      <div>
        <h1 className="text-4xl font-bold text-white">Gráficas vs - Comparación ETL</h1>
        <p className="text-gray-400 mt-2">Comparaciones lado a lado entre bases de datos</p>
      </div>

      <div className="flex gap-2">
        <Button onClick={loadData} className="bg-blue-600 hover:bg-blue-700 text-white">
          <RotateCcw className="w-4 h-4 mr-2" />
          Recargar
        </Button>
        <Button onClick={() => {
          if (window.confirm('¿Eliminar historial?')) {
            localStorage.removeItem('etl_query_history');
            setQueries([]);
            setSelectedId(null);
            setChart(null);
          }
        }} className="bg-red-600 hover:bg-red-700 text-white">
          <Trash2 className="w-4 h-4 mr-2" />
          Limpiar
        </Button>
      </div>

      {!queries.length ? (
        <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <h3 className="text-gray-300 font-semibold">No hay consultas guardadas</h3>
            <p className="text-gray-400 text-sm">Ejecuta una consulta ETL para ver gráficos</p>
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
                {queries.map((q) => (
                  <div
                    key={q.id}
                    onClick={() => setSelectedId(q.id)}
                    className={`p-3 rounded-lg cursor-pointer ${selectedId === q.id ? 'bg-blue-600 text-white' : 'bg-slate-700 text-gray-300 hover:bg-slate-600'}`}
                  >
                    <div className="text-xs font-mono truncate">{q.query.substring(0, 80)}...</div>
                    <div className="text-xs text-gray-400 mt-1">{q.connectionName} • {q.rows.length} filas</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {chart ? (
            <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Gráfico Comparativo</CardTitle>
              </CardHeader>
              <CardContent>
                <div style={{ height: '450px' }}>
                  <Bar
                    data={chart}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { labels: { color: '#9CA3AF' } },
                        tooltip: { backgroundColor: '#1F2937', titleColor: '#FFF', bodyColor: '#D1D5DB' },
                      },
                      scales: {
                        x: { grid: { color: '#374151' }, ticks: { color: '#9CA3AF' } },
                        y: { grid: { color: '#374151' }, ticks: { color: '#9CA3AF' } },
                      },
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
              <CardContent className="p-8 text-center">
                <AlertCircle className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <h3 className="text-gray-300 font-semibold">No hay datos para visualizar</h3>
                <p className="text-gray-400 text-sm">Selecciona una consulta para ver su gráfico</p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
