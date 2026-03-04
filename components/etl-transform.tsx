'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Copy, AlertCircle, Plus, Trash2, ChevronDown } from 'lucide-react';

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

interface TableConfig {
  name: string;
  columns: string[];
  joinWith?: {
    tableIndex: number;
    condition: string;
    joinType: 'INNER' | 'LEFT' | 'RIGHT' | 'FULL';
  };
}

export function ETLTransform() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedConnection, setSelectedConnection] = useState<string>('');
  const [query, setQuery] = useState('SELECT * FROM tabla LIMIT 10');
  const [results, setResults] = useState<QueryResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [queryHistory, setQueryHistory] = useState<any[]>([]);
  const [selectedTables, setSelectedTables] = useState<TableConfig[]>([]);
  const [availableTables, setAvailableTables] = useState<string[]>([]);
  const [showTableSelector, setShowTableSelector] = useState(false);
  const [selectedConnections, setSelectedConnections] = useState<string[]>([]);
  const [multiDBResults, setMultiDBResults] = useState<Record<string, QueryResult | null>>({});

  useEffect(() => {
    loadConnections();
    loadQueryHistory();
  }, []);

  useEffect(() => {
    if (selectedConnection) {
      loadAvailableTables();
    }
  }, [selectedConnection]);

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

  const loadAvailableTables = async () => {
    try {
      const connection = connections.find((c) => c.id === selectedConnection);
      if (!connection) return;

      const res = await fetch('/api/etl/tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: connection.host,
          user: connection.user,
          password: connection.password,
          database: connection.database,
          ssl: connection.ssl,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setAvailableTables(data.tables || []);
      }
    } catch (err) {
      console.error('Error loading tables:', err);
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
    const connectionsToUse = selectedConnections.length > 0 
      ? selectedConnections 
      : [selectedConnection];

    if (connectionsToUse.length === 0 || !connectionsToUse[0]) {
      setError('Selecciona al menos una conexión');
      return;
    }

    if (!query.trim()) {
      setError('Ingresa una consulta SQL');
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);
    setMultiDBResults({});

    try {
      const results: Record<string, QueryResult | null> = {};
      let firstResult: QueryResult | null = null;

      for (const connId of connectionsToUse) {
        const connection = connections.find((c) => c.id === connId);
        if (!connection) continue;

        try {
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
              connectionName: connection.name,
              connectionId: connId,
            }),
          });

          const data = await res.json();

          if (data.success) {
            const result = {
              rows: data.rows,
              columns: data.columns,
              rowCount: data.rowCount,
            };
            results[connection.name] = result;
            if (!firstResult) firstResult = result;
          } else {
            results[connection.name] = null;
          }
        } catch (err) {
          console.error(`Error executing query on ${connection.name}:`, err);
          results[connection.name] = null;
        }
      }

      if (firstResult) {
        setResults(firstResult);
        setMultiDBResults(results);
        saveToHistory(query.trim(), firstResult);
      } else {
        setError('No se obtuvieron resultados de ninguna conexión');
      }
    } catch (err: any) {
      setError(err.message || 'Error en la consulta');
    } finally {
      setLoading(false);
    }
  };

  const addTable = (tableName: string) => {
    if (!selectedTables.find((t) => t.name === tableName)) {
      setSelectedTables([...selectedTables, { name: tableName, columns: [] }]);
    }
  };

  const removeTable = (tableName: string) => {
    setSelectedTables(selectedTables.filter((t) => t.name !== tableName));
  };

  const updateTableColumns = (tableName: string, columns: string[]) => {
    setSelectedTables(
      selectedTables.map((t) =>
        t.name === tableName ? { ...t, columns } : t
      )
    );
  };

  const updateTableJoin = (
    tableName: string,
    joinWith: TableConfig['joinWith']
  ) => {
    setSelectedTables(
      selectedTables.map((t) =>
        t.name === tableName ? { ...t, joinWith } : t
      )
    );
  };

  const buildMultiTableQuery = () => {
    if (selectedTables.length === 0) {
      setError('Selecciona al menos una tabla');
      return;
    }

    if (selectedTables.length === 1) {
      const table = selectedTables[0];
      const cols =
        table.columns.length > 0 ? table.columns.join(', ') : '*';
      setQuery(`SELECT ${cols} FROM ${table.name} LIMIT 100`);
    } else {
      let sql = `SELECT * FROM ${selectedTables[0].name}`;
      for (let i = 1; i < selectedTables.length; i++) {
        const table = selectedTables[i];
        const joinType = table.joinWith?.joinType || 'LEFT';
        const condition = table.joinWith?.condition || `${selectedTables[0].name}.id = ${table.name}.id`;
        sql += ` ${joinType} JOIN ${table.name} ON ${condition}`;
      }
      sql += ' LIMIT 100';
      setQuery(sql);
    }
    setShowTableSelector(false);
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
            {/* Selector de conexión (Primaria) */}
            <div>
              <label className="block text-sm text-gray-300 mb-2">Base de Datos Principal</label>
              <select
                value={selectedConnection}
                onChange={(e) => {
                  setSelectedConnection(e.target.value);
                  if (!selectedConnections.includes(e.target.value)) {
                    setSelectedConnections([e.target.value]);
                  }
                }}
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

            {/* Selector de múltiples conexiones para comparación */}
            {connections.length > 1 && (
              <div>
                <label className="block text-sm text-gray-300 mb-2">Bases de Datos Adicionales (Comparación)</label>
                <div className="space-y-2 bg-slate-700/50 p-3 rounded-lg">
                  {connections.map((conn) => (
                    <label key={conn.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedConnections.includes(conn.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedConnections([...selectedConnections, conn.id]);
                          } else {
                            setSelectedConnections(
                              selectedConnections.filter((id) => id !== conn.id)
                            );
                          }
                        }}
                        className="w-4 h-4 rounded border-slate-600 bg-slate-600"
                      />
                      <span className="text-sm text-gray-300">{conn.name} ({conn.database})</span>
                    </label>
                  ))}
                </div>
                {selectedConnections.length > 1 && (
                  <p className="text-xs text-blue-400 mt-2">
                    {selectedConnections.length} bases de datos seleccionadas para comparación
                  </p>
                )}
              </div>
            )}

            {/* Selector Multi-Tabla */}
            {availableTables.length > 0 && (
              <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-gray-300">Selecciona Tablas (Multi-Join)</label>
                  <button
                    onClick={() => setShowTableSelector(!showTableSelector)}
                    className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded flex gap-1 items-center"
                  >
                    <Plus className="w-3 h-3" />
                    Agregar Tabla
                    <ChevronDown className={`w-3 h-3 transition-transform ${showTableSelector ? 'rotate-180' : ''}`} />
                  </button>
                </div>

                {showTableSelector && (
                  <div className="bg-slate-800 rounded p-2 space-y-2">
                    {availableTables.map((table) => (
                      <button
                        key={table}
                        onClick={() => addTable(table)}
                        disabled={selectedTables.some((t) => t.name === table)}
                        className="w-full text-left px-2 py-2 rounded text-xs bg-slate-700 hover:bg-slate-600 text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition"
                      >
                        + {table}
                      </button>
                    ))}
                  </div>
                )}

                {selectedTables.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-gray-400">Tablas seleccionadas:</p>
                    {selectedTables.map((table, idx) => (
                      <div key={table.name} className="bg-slate-600/50 border border-slate-500 rounded p-2 text-xs space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-gray-200">{table.name}</span>
                          <button
                            onClick={() => removeTable(table.name)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>

                        {idx > 0 && (
                          <div className="space-y-2 pt-2 border-t border-slate-500">
                            <select
                              defaultValue={table.joinWith?.joinType || 'LEFT'}
                              onChange={(e) => {
                                const joinType = e.target.value as 'INNER' | 'LEFT' | 'RIGHT' | 'FULL';
                                updateTableJoin(table.name, {
                                  tableIndex: idx - 1,
                                  condition: table.joinWith?.condition || `${selectedTables[0].name}.id = ${table.name}.id`,
                                  joinType,
                                });
                              }}
                              className="w-full bg-slate-700 text-white border border-slate-600 rounded p-1 text-xs"
                            >
                              <option value="INNER">INNER JOIN</option>
                              <option value="LEFT">LEFT JOIN</option>
                              <option value="RIGHT">RIGHT JOIN</option>
                              <option value="FULL">FULL JOIN</option>
                            </select>
                            <input
                              type="text"
                              placeholder="Condición de JOIN (ej: tabla1.id = tabla2.id)"
                              defaultValue={table.joinWith?.condition || `${selectedTables[0].name}.id = ${table.name}.id`}
                              onChange={(e) => {
                                updateTableJoin(table.name, {
                                  tableIndex: idx - 1,
                                  condition: e.target.value,
                                  joinType: table.joinWith?.joinType || 'LEFT',
                                });
                              }}
                              className="w-full bg-slate-700 text-white border border-slate-600 rounded p-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={buildMultiTableQuery}
                      className="w-full bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-2 py-1.5 rounded transition"
                    >
                      Construir Consulta
                    </button>
                  </div>
                )}
              </div>
            )}

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

            {/* Comparación Multi-DB */}
            {Object.keys(multiDBResults).length > 1 && (
              <div className="space-y-4 mt-6 pt-6 border-t border-slate-700">
                <h3 className="text-white font-semibold text-lg">Comparación entre Bases de Datos</h3>
                <div className="grid grid-cols-1 gap-4">
                  {Object.entries(multiDBResults).map(([dbName, result]) => (
                    result && (
                      <div key={dbName} className="bg-slate-700/50 border border-slate-600 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="text-blue-300 font-semibold text-sm">{dbName} ({result.rowCount} filas)</h4>
                          <button
                            onClick={() => navigator.clipboard.writeText(JSON.stringify(result.rows, null, 2))}
                            className="text-blue-400 hover:text-blue-300 flex gap-1 text-xs"
                          >
                            <Copy className="w-3 h-3" />
                            Copiar
                          </button>
                        </div>

                        <div className="bg-slate-800 rounded p-2 overflow-x-auto max-h-48 overflow-y-auto text-xs">
                          <table className="w-full text-left">
                            <thead>
                              <tr className="border-b border-slate-600">
                                {result.columns.map((col) => (
                                  <th key={col} className="p-1.5 text-gray-300 font-semibold whitespace-nowrap text-xs">
                                    {col}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {result.rows.slice(0, 10).map((row, idx) => (
                                <tr key={idx} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                                  {result.columns.map((col) => (
                                    <td key={col} className="p-1.5 text-gray-400 whitespace-nowrap max-w-xs truncate text-xs">
                                      {String(row[col] ?? '')}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Estadísticas rápidas de esta BD */}
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          <div className="bg-slate-600/50 rounded p-2">
                            <p className="text-xs text-gray-400">Total Filas</p>
                            <p className="text-lg font-bold text-blue-400">{result.rowCount}</p>
                          </div>
                          <div className="bg-slate-600/50 rounded p-2">
                            <p className="text-xs text-gray-400">Columnas</p>
                            <p className="text-lg font-bold text-blue-400">{result.columns.length}</p>
                          </div>
                        </div>
                      </div>
                    )
                  ))}
                </div>

                {/* Resumen Comparativo */}
                <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
                  <h4 className="text-blue-300 font-semibold mb-3">Resumen Comparativo</h4>
                  <div className="space-y-2">
                    {Object.entries(multiDBResults).map(([dbName, result]) => {
                      if (!result) return null;
                      return (
                        <div key={dbName} className="flex items-center justify-between text-sm">
                          <span className="text-gray-300">{dbName}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-gray-400 text-xs">{result.rowCount} filas • {result.columns.length} columnas</span>
                            <div className="w-32 bg-slate-600 rounded h-2">
                              <div
                                className="bg-blue-500 h-full rounded"
                                style={{
                                  width: `${Math.min(
                                    (result.rowCount /
                                      Math.max(...Object.values(multiDBResults)
                                        .filter((r) => r !== null)
                                        .map((r) => r!.rowCount))) * 100,
                                    100
                                  )}%`,
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
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
