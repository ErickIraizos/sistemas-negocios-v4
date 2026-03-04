'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Copy, AlertCircle } from 'lucide-react';

interface Connection {
  id: string;
  name: string;
  host: string;
  user: string;
  password: string;
  database: string;
  ssl: boolean;
}

interface QueryResult {
  rows: any[];
  columns: string[];
  rowCount: number;
}

export function ETLTransform() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedConnection, setSelectedConnection] = useState<string>('');
  const [query, setQuery] = useState('SELECT * FROM tabla LIMIT 10');
  const [results, setResults] = useState<QueryResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [queryHistory, setQueryHistory] = useState<any[]>([]);

  useEffect(() => {
    loadConnections();
    loadQueryHistory();
  }, []);

  const loadConnections = async () => {
    try {
      const res = await fetch('/api/etl/connections');
      const data = await res.json();
      setConnections(data.connections || []);
      if (data.connections?.length > 0) {
        setSelectedConnection(data.connections[0].id);
      }
    } catch (err) {
      console.error('Error loading connections:', err);
    }
  };

  const loadQueryHistory = async () => {
    try {
      const stored = localStorage.getItem('etl_query_history');
      if (stored) {
        setQueryHistory(JSON.parse(stored));
      }
    } catch (err) {
      console.error('Error loading history:', err);
    }
  };

  const saveToHistory = (q: string, res: QueryResult) => {
    const newHistory = [
      {
        id: `etl_${Date.now()}`,
        query: q,
        rows: res.rows,
        columns: res.columns,
        timestamp: new Date().toISOString(),
        connectionId: selectedConnection,
        isETL: true,
      },
      ...queryHistory,
    ].slice(0, 50);
    
    setQueryHistory(newHistory);
    localStorage.setItem('etl_query_history', JSON.stringify(newHistory));
  };

  const executeQuery = async () => {
    if (!selectedConnection) {
      setError('Selecciona una conexión');
      return;
    }

    if (!query.trim()) {
      setError('Ingresa una consulta SQL');
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const connection = connections.find((c) => c.id === selectedConnection);
      if (!connection) throw new Error('Conexión no encontrada');

      const res = await fetch('/api/etl/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: connection.host,
          user: connection.user,
          password: connection.password,
          database: connection.database,
          ssl: connection.ssl,
          query: query.trim(),
        }),
      });

      const data = await res.json();

      if (data.success) {
        setResults({
          rows: data.rows,
          columns: data.columns,
          rowCount: data.rowCount,
        });
        saveToHistory(query.trim(), {
          rows: data.rows,
          columns: data.columns,
          rowCount: data.rowCount,
        });
      } else {
        setError(data.error || 'Error ejecutando consulta');
      }
    } catch (err: any) {
      setError(err.message || 'Error en la consulta');
    } finally {
      setLoading(false);
    }
  };

  const selectedConn = connections.find((c) => c.id === selectedConnection);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold text-white">ETL - Transformar Datos</h1>
        <p className="text-gray-400">Extrae, transforma y consulta datos de otras bases de datos</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Editor */}
        <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-white flex items-center justify-between">
              <span>Consulta SQL</span>
              <span className="text-xs font-normal text-gray-400">
                Solo SELECT permitido
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Selector de conexión */}
            <div>
              <label className="block text-sm text-gray-300 mb-2">Selecciona Base de Datos</label>
              <select
                value={selectedConnection}
                onChange={(e) => setSelectedConnection(e.target.value)}
                className="w-full bg-slate-700 text-white border border-slate-600 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Selecciona una conexión --</option>
                {connections.map((conn) => (
                  <option key={conn.id} value={conn.id}>
                    {conn.name} ({conn.database})
                  </option>
                ))}
              </select>
              {selectedConn && (
                <p className="text-xs text-gray-400 mt-1">
                  Conectado a: {selectedConn.host} • BD: {selectedConn.database}
                </p>
              )}
            </div>

            {/* Editor SQL */}
            <div>
              <label className="block text-sm text-gray-300 mb-2">SQL Query</label>
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="SELECT * FROM tabla WHERE condicion"
                className="w-full h-48 bg-slate-700 text-white border border-slate-600 rounded-lg p-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Errores */}
            {error && (
              <div className="bg-red-900/20 border border-red-700 rounded p-3 flex gap-2 text-red-400 text-sm">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>{error}</div>
              </div>
            )}

            {/* Botones */}
            <div className="flex gap-2">
              <Button
                onClick={executeQuery}
                disabled={loading || !selectedConnection}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white gap-2"
              >
                <Play className="w-4 h-4" />
                {loading ? 'Ejecutando...' : 'Ejecutar'}
              </Button>
            </div>

            {/* Resultados */}
            {results && (
              <div className="space-y-3 mt-6 pt-6 border-t border-slate-700">
                <div className="flex justify-between items-center">
                  <h3 className="text-white font-semibold">Resultados ({results.rowCount} filas)</h3>
                  <button
                    onClick={() => navigator.clipboard.writeText(JSON.stringify(results.rows, null, 2))}
                    className="text-blue-400 hover:text-blue-300 flex gap-1 text-sm"
                  >
                    <Copy className="w-4 h-4" />
                    Copiar JSON
                  </button>
                </div>

                <div className="bg-slate-700 rounded p-3 overflow-x-auto max-h-64 overflow-y-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-slate-600">
                        {results.columns.map((col) => (
                          <th key={col} className="p-2 text-gray-300 font-semibold whitespace-nowrap">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {results.rows.slice(0, 20).map((row, idx) => (
                        <tr key={idx} className="border-b border-slate-600 hover:bg-slate-600/50">
                          {results.columns.map((col) => (
                            <td key={col} className="p-2 text-gray-300 whitespace-nowrap max-w-xs truncate">
                              {String(row[col] ?? '')}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Historial */}
        <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 h-fit">
          <CardHeader>
            <CardTitle className="text-white text-base">Historial ETL</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-96 overflow-y-auto">
            {queryHistory.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">Sin historial</p>
            ) : (
              queryHistory.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setQuery(item.query)}
                  className="w-full bg-green-900/20 border border-green-700 rounded p-2 hover:bg-green-900/30 transition text-left text-xs"
                >
                  <p className="text-green-400 font-mono truncate">{item.query.substring(0, 40)}...</p>
                  <p className="text-gray-400 text-xs mt-1">{new Date(item.timestamp).toLocaleString('es-ES')}</p>
                </button>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
