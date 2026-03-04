'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowRight } from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, ArcElement, PointElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar, Line, Pie } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, ArcElement, PointElement, Title, Tooltip, Legend);

interface Stats {
  status: string;
  totalTables: number;
  totalColumns: number;
  totalRows: number;
}

export function Dashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/db/stats');
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Error al cargar estadísticas');
      } else {
        setStats(data);
        setError(null);
      }
    } catch (err) {
      setError('Error de conexión al servidor');
      console.error('Error fetching stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-white">Vista General del Sistema</h1>
        </div>
        <div className="bg-red-900/20 border border-red-700 rounded-lg p-6 text-red-400">
          <p className="font-semibold">Error de Conexión</p>
          <p className="text-sm mt-2">{error}</p>
          <p className="text-xs mt-4 text-gray-400">
            Verifica que las variables de entorno estén configuradas correctamente
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white">Vista General del Sistema</h1>
          <p className="text-gray-400">Monitoea la salud de tu base de datos y la actividad reciente.</p>
        </div>
        <Button
          onClick={() => router.push('/consola-sql')}
          className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
        >
          Nueva Consulta
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 hover:border-green-600 transition-colors cursor-help" title="Verde = Sistema operativo correctamente">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-gray-300">
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
              </div>
              <span>Estado del Sistema</span>
            </CardTitle>
            <p className="text-xs text-gray-400 mt-1">Indica si la BD está disponible</p>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-500">{stats?.status || 'Desconocido'}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 hover:border-blue-600 transition-colors">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-gray-300">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <span>Total de Tablas</span>
            </CardTitle>
            <p className="text-xs text-gray-400 mt-1">Cantidad de tablas en la BD</p>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-400">{stats?.totalTables || 0}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 hover:border-purple-600 transition-colors">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-gray-300">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v4h8v-4zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                </svg>
              </div>
              <span>Total de Columnas</span>
            </CardTitle>
            <p className="text-xs text-gray-400 mt-1">Campos en todas las tablas</p>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-purple-400">{stats?.totalColumns || 0}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 hover:border-orange-600 transition-colors">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-gray-300">
              <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span>Total de Registros</span>
            </CardTitle>
            <p className="text-xs text-gray-400 mt-1">Filas totales en todas las tablas</p>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-orange-400">{stats?.totalRows || 0}</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Indicadores Clave de Desempeño (KPIs)</h2>
          <p className="text-gray-400 text-sm">Métricas para la toma de decisiones</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Casos por Enfermedad */}
          <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 hover:border-blue-600 transition-colors">
            <CardHeader>
              <CardTitle className="text-white text-base flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                Casos Atendidos por Enfermedad
              </CardTitle>
              <p className="text-gray-400 text-xs mt-2">Distribución de casos: cada barra representa el número de casos atendidos por enfermedad. Útil para identificar enfermedades prevalentes.</p>
            </CardHeader>
            <CardContent>
              <Bar
                data={{
                  labels: ['Gripe', 'COVID-19', 'Dengue', 'Diabetes', 'Hipertensión'],
                  datasets: [{
                    label: 'Casos',
                    data: [245, 189, 156, 342, 287],
                    backgroundColor: '#3B82F6',
                    borderColor: '#3B82F6',
                    borderRadius: 8,
                  }],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: true,
                  plugins: {
                    legend: { labels: { color: '#9CA3AF' } },
                    tooltip: {
                      backgroundColor: '#1F2937',
                      borderColor: '#4B5563',
                      borderWidth: 1,
                      titleColor: '#FFFFFF',
                      bodyColor: '#D1D5DB',
                    },
                  },
                  scales: {
                    x: { grid: { color: '#374151' }, ticks: { color: '#9CA3AF' } },
                    y: { grid: { color: '#374151' }, ticks: { color: '#9CA3AF' } },
                  },
                }}
                height={300}
              />
            </CardContent>
          </Card>

          {/* Cirugías por Mes */}
          <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 hover:border-green-600 transition-colors">
            <CardHeader>
              <CardTitle className="text-white text-base flex items-center gap-2">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Tendencia Quirúrgica
              </CardTitle>
              <p className="text-gray-400 text-xs mt-2">Evolución mensual: la línea muestra el volumen de cirugías. Identifica picos de actividad y tendencias.</p>
            </CardHeader>
            <CardContent>
              <Line
                data={{
                  labels: ['Sep', 'Oct', 'Nov', 'Dic', 'Ene', 'Feb'],
                  datasets: [{
                    label: 'Cirugías',
                    data: [45, 52, 48, 61, 55, 68],
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    borderColor: '#10B981',
                    borderWidth: 2,
                    pointBackgroundColor: '#10B981',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    tension: 0.4,
                  }],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: true,
                  plugins: {
                    legend: { labels: { color: '#9CA3AF' } },
                    tooltip: {
                      backgroundColor: '#1F2937',
                      borderColor: '#4B5563',
                      borderWidth: 1,
                      titleColor: '#FFFFFF',
                      bodyColor: '#D1D5DB',
                    },
                  },
                  scales: {
                    x: { grid: { color: '#374151' }, ticks: { color: '#9CA3AF' } },
                    y: { grid: { color: '#374151' }, ticks: { color: '#9CA3AF' } },
                  },
                }}
                height={300}
              />
            </CardContent>
          </Card>

          {/* Distribución de Pacientes */}
          <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 hover:border-pink-600 transition-colors">
            <CardHeader>
              <CardTitle className="text-white text-base flex items-center gap-2">
                <svg className="w-5 h-5 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Segmentación Demográfica
              </CardTitle>
              <p className="text-gray-400 text-xs mt-2">Proporción por género: cada sección del pastel representa el porcentaje de pacientes. Ayuda a entender la composición de usuarios.</p>
            </CardHeader>
            <CardContent>
              <Pie
                data={{
                  labels: ['Masculino', 'Femenino', 'Otro'],
                  datasets: [{
                    label: 'Pacientes',
                    data: [456, 523, 89],
                    backgroundColor: ['#3B82F6', '#EC4899', '#F59E0B'],
                    borderColor: '#1F2937',
                    borderWidth: 2,
                  }],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: true,
                  plugins: {
                    legend: { 
                      labels: { color: '#9CA3AF' },
                      position: 'bottom' as const,
                    },
                    tooltip: {
                      backgroundColor: '#1F2937',
                      borderColor: '#4B5563',
                      borderWidth: 1,
                      titleColor: '#FFFFFF',
                      bodyColor: '#D1D5DB',
                    },
                  },
                }}
                height={300}
              />
            </CardContent>
          </Card>

          {/* Tasa de Ocupación */}
          <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 hover:border-orange-600 transition-colors">
            <CardHeader>
              <CardTitle className="text-white text-base flex items-center gap-2">
                <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Eficiencia de Recursos
              </CardTitle>
              <p className="text-gray-400 text-xs mt-2">Ocupación por piso: rojo=ocupadas, verde=disponibles. Permite optimizar la asignación de recursos y planificación.</p>
            </CardHeader>
            <CardContent>
              <Bar
                data={{
                  labels: ['Piso 1', 'Piso 2', 'Piso 3', 'Piso 4', 'Piso 5'],
                  datasets: [
                    {
                      label: 'Ocupadas',
                      data: [25, 32, 28, 35, 20],
                      backgroundColor: '#EF4444',
                      borderColor: '#EF4444',
                      borderRadius: 8,
                    },
                    {
                      label: 'Disponibles',
                      data: [15, 8, 12, 5, 20],
                      backgroundColor: '#10B981',
                      borderColor: '#10B981',
                      borderRadius: 8,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: true,
                  plugins: {
                    legend: { labels: { color: '#9CA3AF' } },
                    tooltip: {
                      backgroundColor: '#1F2937',
                      borderColor: '#4B5563',
                      borderWidth: 1,
                      titleColor: '#FFFFFF',
                      bodyColor: '#D1D5DB',
                    },
                  },
                  scales: {
                    x: { grid: { color: '#374151' }, ticks: { color: '#9CA3AF' } },
                    y: { grid: { color: '#374151' }, ticks: { color: '#9CA3AF' } },
                  },
                }}
                height={300}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
