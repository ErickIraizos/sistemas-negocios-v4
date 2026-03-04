'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, Copy, Check } from 'lucide-react';

interface QueryRecord {
  id: number;
  query: string;
  timestamp: string;
  columns: string[];
  rows: any[];
}

export function Historial() {
  const [history, setHistory] = useState<QueryRecord[]>([]);
  const [copied, setCopied] = useState<number | null>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = () => {
    const stored = localStorage.getItem('sqlHistory');
    if (stored) {
      setHistory(JSON.parse(stored));
    }
  };

  const deleteQuery = (id: number) => {
    const updated = history.filter((q) => q.id !== id);
    setHistory(updated);
    localStorage.setItem('sqlHistory', JSON.stringify(updated));
  };

  const clearAll = () => {
    if (window.confirm('¿Estás seguro de que quieres borrar todo el historial?')) {
      setHistory([]);
      localStorage.removeItem('sqlHistory');
    }
  };

  const copyToClipboard = (query: string, id: number) => {
    navigator.clipboard.writeText(query);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold text-white">Historial de Consultas</h1>
        <p className="text-gray-400">Todas tus consultas SQL ejecutadas guardadas aquí</p>
      </div>

      {history.length > 0 && (
        <div className="flex justify-end">
          <Button
            onClick={clearAll}
            variant="outline"
            className="border-red-700 text-red-400 hover:bg-red-900/20"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Limpiar Historial
          </Button>
        </div>
      )}

      {history.length === 0 ? (
        <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
          <CardContent className="pt-6">
            <p className="text-gray-400 text-center">No hay consultas en el historial</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {history.map((item) => (
            <Card key={item.id} className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-xs text-gray-400 mb-2">{item.timestamp}</p>
                    <code className="text-sm text-blue-400 font-mono break-all">
                      {item.query}
                    </code>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button
                    onClick={() => copyToClipboard(item.query, item.id)}
                    size="sm"
                    variant="outline"
                    className="border-slate-700 text-gray-300 hover:bg-slate-700"
                  >
                    {copied === item.id ? (
                      <>
                        <Check className="w-4 h-4" />
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copiar
                      </>
                    )}
                  </Button>

                  <Button
                    onClick={() => deleteQuery(item.id)}
                    size="sm"
                    variant="outline"
                    className="border-red-700 text-red-400 hover:bg-red-900/20 ml-auto"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                {item.rows.length > 0 && (
                  <div className="mt-3 text-xs text-gray-400">
                    {item.rows.length} fila(s) retornada(s)
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
