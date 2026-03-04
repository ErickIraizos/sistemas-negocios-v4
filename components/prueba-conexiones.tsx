'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, CheckCircle, XCircle } from 'lucide-react';

interface Connection {
  id: string;
  name: string;
  host: string;
  user: string;
  password: string;
  database: string;
  ssl: boolean;
}

interface TableInfo {
  table_name: string;
  rows: number;
  data: any[];
}

export function PruebaConexiones() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [tableData, setTableData] = useState<Record<string, TableInfo[]>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadConnections();
  }, []);

  const loadConnections = async () => {
    try {
      const res = await fetch('/api/etl/connections');
      const data = await res.json();
      setConnections(data.connections || []);
    } catch (err) {
      console.error('Error loading connections:', err);
    }
  };

  const testConnection = async (connection: Connection) => {
    setLoading((prev) => ({ ...prev, [connection.id]: true }));
    setErrors((prev) => ({ ...prev, [connection.id]: '' }));

    try {
      // Obtener tablas
      const tablesQuery = `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        LIMIT 5
      `;

      const res = await fetch('/api/etl/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: connection.host,
          user: connection.user,
          password: connection.password,
          database: connection.database,
          ssl: connection.ssl,
          query: tablesQuery,
        }),
      });

      const tablesData = await res.json();

      if (!tablesData.success) {
        setErrors((prev) => ({
          ...prev,
          [connection.id]: tablesData.error || 'Error conectando',
        }));
        setLoading((prev) => ({ ...prev, [connection.id]: false }));
        return;
      }

      // Para cada tabla, obtener 10 primeras filas
      const results: TableInfo[] = [];
      for (const tableRow of tablesData.rows) {
        const tableName = tableRow.table_name;
        const dataQuery = `SELECT * FROM "${tableName}" LIMIT 10`;

        const dataRes = await fetch('/api/etl/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            host: connection.host,
            user: connection.user,
            password: connection.password,
            database: connection.database,
            ssl: connection.ssl,
            query: dataQuery,
          }),
        });

        const dataResult = await dataRes.json();

        if (dataResult.success) {
          results.push({
            table_name: tableName,
            rows: dataResult.rowCount,
            data: dataResult.rows.slice(0, 10),
          });
        }
      }

      setTableData((prev) => ({
        ...prev,
        [connection.id]: results,
      }));
    } catch (err: any) {
      setErrors((prev) => ({
        ...prev,
        [connection.id]: err.message || 'Error en la prueba',
      }));
    } finally {
      setLoading((prev) => ({ ...prev, [connection.id]: false }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold text-white">Prueba de Conexiones</h1>
        <p className="text-gray-400">Verifica que todas tus bases de datos estén conectadas correctamente</p>
      </div>

      {connections.length === 0 ? (
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="pt-6 text-center">
            <p className="text-gray-400">No hay conexiones configuradas. Ve a "Insertar DB" para crear una.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {connections.map((connection) => (
            <Card key={connection.id} className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center justify-between">
                  <div>
                    <p>{connection.name}</p>
                    <p className="text-xs font-normal text-gray-400 mt-1">
                      {connection.host} • {connection.database}
                    </p>
                  </div>
                  <Button
                    onClick={() => testConnection(connection)}
                    disabled={loading[connection.id]}
                    className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
                  >
                    <RefreshCw className={`w-4 h-4 ${loading[connection.id] ? 'animate-spin' : ''}`} />
                    {loading[connection.id] ? 'Probando...' : 'Probar'}
                  </Button>
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Error */}
                {errors[connection.id] && (
                  <div className="bg-red-900/20 border border-red-700 rounded p-4 flex gap-2">
                    <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div className="text-red-400 text-sm">{errors[connection.id]}</div>
                  </div>
                )}

                {/* Éxito */}
                {!errors[connection.id] && tableData[connection.id] && tableData[connection.id].length > 0 && (
                  <div className="bg-green-900/20 border border-green-700 rounded p-4 flex gap-2">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <div className="text-green-400 text-sm">
                      Conexión exitosa. Se encontraron {tableData[connection.id].length} tablas.
                    </div>
                  </div>
                )}

                {/* Tablas */}
                {tableData[connection.id] && tableData[connection.id].length > 0 && (
                  <div className="space-y-3">
                    {tableData[connection.id].map((table) => (
                      <div key={table.table_name} className="bg-slate-700 rounded-lg p-4 space-y-2">
                        <p className="text-white font-semibold flex items-center gap-2">
                          <span className="text-xs bg-blue-600 px-2 py-1 rounded text-white">
                            {table.rows} filas
                          </span>
                          <span className="font-mono text-sm">{table.table_name}</span>
                        </p>

                        {table.data.length > 0 && (
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="border-b border-slate-600">
                                  {Object.keys(table.data[0]).map((col) => (
                                    <th
                                      key={col}
                                      className="p-2 text-gray-300 font-semibold text-left whitespace-nowrap"
                                    >
                                      {col}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {table.data.slice(0, 3).map((row, idx) => (
                                  <tr key={idx} className="border-b border-slate-600 hover:bg-slate-600/50">
                                    {Object.values(row).map((val, colIdx) => (
                                      <td
                                        key={colIdx}
                                        className="p-2 text-gray-300 whitespace-nowrap max-w-xs truncate"
                                      >
                                        {String(val ?? '')}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            {table.data.length > 3 && (
                              <p className="text-gray-400 text-xs mt-2 p-2">
                                ... +{table.data.length - 3} filas más
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
