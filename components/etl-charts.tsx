'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, LineElement, PointElement } from 'chart.js';
import { Bar, Pie, Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, LineElement, PointElement);

interface ETLChartsProps {
  multiDBResults: Record<string, any[]>;
  columns: string[];
  labelColumn: string;
  selectedConnections: string[];
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

export function ETLCharts({
  multiDBResults,
  columns,
  labelColumn,
  selectedConnections,
}: ETLChartsProps) {
  const [chartType, setChartType] = useState<'grouped-bar' | 'stacked-bar' | 'line' | 'comparison-pie'>('grouped-bar');
  const [selectedMetric, setSelectedMetric] = useState<string>(columns[0] || '');

  // Obtener datos numéricos
  const numericColumns = columns.filter((col) => {
    for (const dbData of Object.values(multiDBResults)) {
      const val = dbData[0]?.[col];
      if (val !== null && val !== undefined && !isNaN(Number(val))) {
        return true;
      }
    }
    return false;
  });

  if (numericColumns.length === 0) {
    return (
      <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-yellow-400">
            <AlertCircle className="w-5 h-5" />
            <p>No hay columnas numéricas para visualizar</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Preparar datos para gráfico agrupado (todos los DBs lado a lado)
  const prepareGroupedBarData = () => {
    const firstDbData = Object.values(multiDBResults)[0] || [];
    const labels = firstDbData.map((row) => String(row[labelColumn] || 'N/A'));

    const datasets = selectedConnections.map((dbName, idx) => {
      const dbData = multiDBResults[dbName] || [];
      const values = dbData.map((row) => {
        const val = row[selectedMetric];
        return Number(val) || 0;
      });

      return {
        label: dbName,
        data: values,
        backgroundColor: COLORS[idx % COLORS.length],
        borderColor: COLORS[idx % COLORS.length],
        borderWidth: 1,
      };
    });

    return { labels, datasets };
  };

  // Preparar datos para gráfico apilado
  const prepareStackedBarData = () => {
    const firstDbData = Object.values(multiDBResults)[0] || [];
    const labels = firstDbData.map((row) => String(row[labelColumn] || 'N/A'));

    const datasets = selectedConnections.map((dbName, idx) => {
      const dbData = multiDBResults[dbName] || [];
      const values = dbData.map((row) => {
        const val = row[selectedMetric];
        return Number(val) || 0;
      });

      return {
        label: dbName,
        data: values,
        backgroundColor: COLORS[idx % COLORS.length],
        borderColor: COLORS[idx % COLORS.length],
        borderWidth: 1,
      };
    });

    return { labels, datasets };
  };

  // Preparar datos para gráfico de líneas
  const prepareLineData = () => {
    const firstDbData = Object.values(multiDBResults)[0] || [];
    const labels = firstDbData.map((row) => String(row[labelColumn] || 'N/A'));

    const datasets = selectedConnections.map((dbName, idx) => {
      const dbData = multiDBResults[dbName] || [];
      const values = dbData.map((row) => {
        const val = row[selectedMetric];
        return Number(val) || 0;
      });

      return {
        label: dbName,
        data: values,
        borderColor: COLORS[idx % COLORS.length],
        backgroundColor: `${COLORS[idx % COLORS.length]}20`,
        borderWidth: 2,
        fill: true,
        tension: 0.4,
      };
    });

    return { labels, datasets };
  };

  // Preparar datos para gráfico de pastel comparativo
  const prepareComparisonPieData = () => {
    const firstDbData = Object.values(multiDBResults)[0] || [];
    const labels = firstDbData.map((row) => String(row[labelColumn] || 'N/A'));

    const datasets = selectedConnections.map((dbName, idx) => {
      const dbData = multiDBResults[dbName] || [];
      const values = dbData.map((row) => {
        const val = row[selectedMetric];
        return Number(val) || 0;
      });

      return {
        label: dbName,
        data: values,
        backgroundColor: COLORS.slice(0, labels.length),
        borderColor: '#1F2937',
        borderWidth: 2,
      };
    });

    return { labels, datasets: [datasets[0]] };
  };

  const getChartData = () => {
    switch (chartType) {
      case 'stacked-bar':
        return prepareStackedBarData();
      case 'line':
        return prepareLineData();
      case 'comparison-pie':
        return prepareComparisonPieData();
      default:
        return prepareGroupedBarData();
    }
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: '#D1D5DB',
          boxWidth: 12,
          padding: 15,
          font: {
            size: 12,
          },
        },
      },
      title: {
        display: true,
        text: `Comparación de ${selectedMetric} entre Sucursales`,
        color: '#F3F4F6',
        font: {
          size: 14,
          weight: 'bold' as const,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(31, 41, 55, 0.9)',
        titleColor: '#F3F4F6',
        bodyColor: '#D1D5DB',
        borderColor: '#4B5563',
        borderWidth: 1,
        padding: 12,
        displayColors: true,
      },
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(75, 85, 99, 0.2)',
        },
        ticks: {
          color: '#9CA3AF',
          font: {
            size: 11,
          },
        },
      },
      y: {
        grid: {
          color: 'rgba(75, 85, 99, 0.2)',
        },
        ticks: {
          color: '#9CA3AF',
          font: {
            size: 11,
          },
        },
      },
    },
  };

  const data = getChartData();

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white text-base">Gráficos ETL - Comparación Multi-Sucursal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Controles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Selector de Tipo de Gráfico */}
            <div>
              <label className="block text-sm text-gray-300 mb-2">Tipo de Gráfico</label>
              <select
                value={chartType}
                onChange={(e) => setChartType(e.target.value as any)}
                className="w-full bg-slate-700 text-white border border-slate-600 rounded-lg p-2 text-sm"
              >
                <option value="grouped-bar">Barras Agrupadas</option>
                <option value="stacked-bar">Barras Apiladas</option>
                <option value="line">Líneas</option>
                <option value="comparison-pie">Pastel</option>
              </select>
            </div>

            {/* Selector de Métrica */}
            <div>
              <label className="block text-sm text-gray-300 mb-2">Métrica a Comparar</label>
              <select
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value)}
                className="w-full bg-slate-700 text-white border border-slate-600 rounded-lg p-2 text-sm"
              >
                {numericColumns.map((col) => (
                  <option key={col} value={col}>
                    {col}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Gráfico */}
          <div className="bg-slate-900 p-6 rounded-lg border border-slate-700">
            <div className="relative h-96">
              {chartType === 'grouped-bar' && (
                <Bar data={data} options={chartOptions as any} />
              )}
              {chartType === 'stacked-bar' && (
                <Bar
                  data={data}
                  options={{
                    ...chartOptions,
                    scales: {
                      ...chartOptions.scales,
                      x: {
                        ...chartOptions.scales.x,
                        stacked: true,
                      },
                      y: {
                        ...chartOptions.scales.y,
                        stacked: true,
                      },
                    },
                  } as any}
                />
              )}
              {chartType === 'line' && (
                <Line data={data} options={chartOptions as any} />
              )}
              {chartType === 'comparison-pie' && (
                <Pie data={data} options={chartOptions as any} />
              )}
            </div>
          </div>

          {/* Tabla de Datos */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr>
                  <th className="bg-slate-700 p-2 text-left text-gray-300">{labelColumn}</th>
                  {selectedConnections.map((dbName) => (
                    <th key={dbName} className="bg-slate-700 p-2 text-center text-gray-300">
                      {dbName}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const firstDbData = Object.values(multiDBResults)[0] || [];
                  return firstDbData.map((row, idx) => (
                    <tr key={idx}>
                      <td className="bg-slate-800 p-2 text-gray-300 border border-slate-700 font-semibold">
                        {String(row[labelColumn] || 'N/A')}
                      </td>
                      {selectedConnections.map((dbName) => {
                        const dbData = multiDBResults[dbName] || [];
                        const value = dbData[idx]?.[selectedMetric] ?? '-';
                        return (
                          <td key={dbName} className="bg-slate-800 p-2 text-center text-gray-300 border border-slate-700">
                            {typeof value === 'number' ? value.toLocaleString('es-ES') : value}
                          </td>
                        );
                      })}
                    </tr>
                  ));
                })()}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
