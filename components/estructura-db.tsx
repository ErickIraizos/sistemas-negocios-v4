'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ChevronDown, ChevronRight } from 'lucide-react';

interface Column {
  name: string;
  type: string;
}

interface Table {
  name: string;
  columns: Column[];
  data: any[];
}

export function EstructuraDB() {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    try {
      const response = await fetch('/api/db/tables');
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Error al cargar las tablas');
        setTables([]);
      } else {
        setTables(data.tables || []);
        setError(null);
      }
    } catch (err) {
      setError('Error de conexión al servidor');
      console.error('Error fetching tables:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpanded = (tableName: string) => {
    const newExpanded = new Set(expanded);
    if (newExpanded.has(tableName)) {
      newExpanded.delete(tableName);
    } else {
      newExpanded.add(tableName);
    }
    setExpanded(newExpanded);
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
      <Card className="bg-gradient-to-br from-red-900/20 to-red-950/20 border-red-700">
        <CardContent className="pt-6">
          <p className="text-red-400 text-center">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (tables.length === 0) {
    return (
      <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
        <CardContent className="pt-6">
          <p className="text-gray-400 text-center">No hay tablas en la base de datos</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold text-white">Estructura de Base de Datos</h1>
        <p className="text-gray-400">Explora la estructura y datos de tus tablas</p>
      </div>

      <div className="space-y-3">
        {tables.map((table) => (
          <Card key={table.name} className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
            <div
              onClick={() => toggleExpanded(table.name)}
              className="cursor-pointer p-4 hover:bg-slate-700/50 transition-colors flex items-center gap-2"
            >
              {expanded.has(table.name) ? (
                <ChevronDown className="w-5 h-5 text-blue-400" />
              ) : (
                <ChevronRight className="w-5 h-5 text-blue-400" />
              )}
              <h3 className="font-semibold text-white text-lg">{table.name}</h3>
              <span className="ml-auto text-sm text-gray-400">
                {table.columns.length} columnas
              </span>
            </div>

            {expanded.has(table.name) && (
              <CardContent className="pt-0">
                <div className="space-y-4 mt-4">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-300 mb-2">Columnas:</h4>
                    <div className="space-y-1">
                      {table.columns.map((col) => (
                        <div key={col.name} className="text-sm text-gray-400 ml-4">
                          <span className="text-blue-400">{col.name}</span> (
                          <span className="text-purple-400">{col.type}</span>)
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-gray-300 mb-2">
                      Primeros 5 registros:
                    </h4>
                    {table.data.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="text-xs text-gray-300 w-full">
                          <thead>
                            <tr className="border-b border-slate-700">
                              {table.columns.map((col) => (
                                <th
                                  key={col.name}
                                  className="text-left py-2 px-3 text-blue-400 font-semibold"
                                >
                                  {col.name}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {table.data.map((row, idx) => (
                              <tr key={idx} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                                {table.columns.map((col) => (
                                  <td key={col.name} className="py-2 px-3">
                                    {String(row[col.name] ?? '-').substring(0, 50)}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-gray-400 ml-4 text-xs">No hay datos en esta tabla</p>
                    )}
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
