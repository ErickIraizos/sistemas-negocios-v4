'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Play, Copy, Check } from 'lucide-react';

interface QueryResult {
  columns: string[];
  rows: any[];
  rowCount: number;
}

export function ConsolaSQL() {
  const [query, setQuery] = useState('SELECT * FROM ');
  const [result, setResult] = useState<QueryResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const executeQuery = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/db/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error);
        return;
      }

      setResult(data);

      // Guardar en historial
      const history = JSON.parse(localStorage.getItem('sqlHistory') || '[]');
      history.unshift({
        id: Date.now(),
        query,
        timestamp: new Date().toLocaleString('es-ES'),
        columns: data.columns,
        rows: data.rows,
      });
      if (history.length > 50) history.pop();
      localStorage.setItem('sqlHistory', JSON.stringify(history));
    } catch (err) {
      setError('Error al ejecutar la consulta');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(query);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold text-white">Consola SQL</h1>
        <p className="text-gray-400">Ejecuta consultas SQL en tu base de datos</p>
      </div>

      <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Editor de Consultas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="SELECT * FROM tabla_nombre..."
            className="w-full h-32 bg-slate-900 text-white border border-slate-700 rounded-lg p-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <div className="flex gap-2">
            <Button
              onClick={executeQuery}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Ejecutando...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Ejecutar
                </>
              )}
            </Button>

            <Button
              onClick={copyToClipboard}
              variant="outline"
              className="border-slate-700 text-gray-300 hover:bg-slate-700"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  Copiado
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copiar
                </>
              )}
            </Button>
          </div>

          {error && (
            <div className="bg-red-900/20 border border-red-700 rounded-lg p-3 text-red-400 text-sm">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {result && (
        <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Resultado ({result.rowCount} filas)</CardTitle>
          </CardHeader>
          <CardContent>
            {result.rows.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="text-xs text-gray-300 w-full">
                  <thead>
                    <tr className="border-b border-slate-700">
                      {result.columns.map((col) => (
                        <th
                          key={col}
                          className="text-left py-2 px-3 text-blue-400 font-semibold"
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.rows.map((row, idx) => (
                      <tr key={idx} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                        {result.columns.map((col) => (
                          <td key={col} className="py-2 px-3">
                            {String(row[col] ?? '-').substring(0, 100)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-400">Sin resultados</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
