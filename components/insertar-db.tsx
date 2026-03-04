'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, X, Loader2 } from 'lucide-react';

interface Connection {
  id: string;
  name: string;
  host: string;
  user: string;
  password: string;
  database: string;
  ssl: boolean;
  createdAt: string;
}

export function InsertarDB() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    host: '',
    user: '',
    password: '',
    database: '',
    ssl: false,
  });

  const loadConnections = async () => {
    try {
      const res = await fetch('/api/etl/connections');
      const data = await res.json();
      setConnections(data.connections || []);
    } catch (err) {
      console.error('Error loading connections:', err);
    }
  };

  const validateConnection = async () => {
    if (!formData.host || !formData.user || !formData.password || !formData.database) {
      setError('Completa todos los campos');
      return;
    }

    setValidating('validating');
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch('/api/etl/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: formData.host,
          user: formData.user,
          password: formData.password,
          database: formData.database,
          ssl: formData.ssl,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setSuccess('Conexión validada correctamente');
        setValidating('valid');
      } else {
        setError(data.error || 'Error en la conexión');
        setValidating('invalid');
      }
    } catch (err) {
      setError('Error al validar conexión');
      setValidating('invalid');
    }
  };

  const saveConnection = async () => {
    if (!formData.name) {
      setError('Ingresa un nombre para la conexión');
      return;
    }

    if (validating !== 'valid') {
      setError('Valida la conexión primero');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/etl/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (data.success) {
        setSuccess('Conexión guardada exitosamente');
        setFormData({
          name: '',
          host: '',
          user: '',
          password: '',
          database: '',
          ssl: false,
        });
        setValidating(null);
        await loadConnections();
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Error al guardar conexión');
    } finally {
      setLoading(false);
    }
  };

  const deleteConnection = async (id: string) => {
    try {
      await fetch(`/api/etl/connections?id=${id}`, { method: 'DELETE' });
      await loadConnections();
    } catch (err) {
      setError('Error al eliminar conexión');
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold text-white">Insertar Base de Datos</h1>
        <p className="text-gray-400">Conecta nuevas bases de datos para extraer datos en el ETL</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulario */}
        <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-white">Nueva Conexión</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm text-gray-300 mb-2">Nombre de la Conexión</label>
              <input
                type="text"
                placeholder="Ej: BD Ventas"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-slate-700 text-white border border-slate-600 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-2">Host</label>
              <input
                type="text"
                placeholder="Ej: db.example.com"
                value={formData.host}
                onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                className="w-full bg-slate-700 text-white border border-slate-600 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-2">Usuario</label>
              <input
                type="text"
                placeholder="usuario_db"
                value={formData.user}
                onChange={(e) => setFormData({ ...formData, user: e.target.value })}
                className="w-full bg-slate-700 text-white border border-slate-600 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-2">Contraseña</label>
              <input
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full bg-slate-700 text-white border border-slate-600 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-2">Base de Datos</label>
              <input
                type="text"
                placeholder="nombre_bd"
                value={formData.database}
                onChange={(e) => setFormData({ ...formData, database: e.target.value })}
                className="w-full bg-slate-700 text-white border border-slate-600 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <label className="flex items-center gap-2 text-sm text-gray-300">
              <input
                type="checkbox"
                checked={formData.ssl}
                onChange={(e) => setFormData({ ...formData, ssl: e.target.checked })}
                className="w-4 h-4"
              />
              Usar SSL
            </label>

            {/* Mensajes */}
            {error && <div className="bg-red-900/20 border border-red-700 rounded p-3 text-red-400 text-sm">{error}</div>}
            {success && <div className="bg-green-900/20 border border-green-700 rounded p-3 text-green-400 text-sm">{success}</div>}

            {/* Botones */}
            <div className="flex gap-2 pt-4">
              <Button
                onClick={validateConnection}
                disabled={validating === 'validating'}
                className="flex-1 bg-orange-600 hover:bg-orange-700 text-white gap-2"
              >
                {validating === 'validating' && <Loader2 className="w-4 h-4 animate-spin" />}
                {validating === 'valid' && <Check className="w-4 h-4" />}
                {validating === 'invalid' && <X className="w-4 h-4" />}
                Validar
              </Button>
              <Button
                onClick={saveConnection}
                disabled={loading || validating !== 'valid'}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {loading ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Conexiones guardadas */}
        <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white text-base">Conexiones Guardadas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-96 overflow-y-auto">
            {connections.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">No hay conexiones guardadas</p>
            ) : (
              connections.map((conn) => (
                <div key={conn.id} className="bg-slate-700 rounded p-3 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-white font-medium text-sm">{conn.name}</p>
                      <p className="text-gray-400 text-xs">{conn.host}</p>
                    </div>
                    <button
                      onClick={() => deleteConnection(conn.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
            {connections.length > 0 && (
              <Button onClick={loadConnections} className="w-full bg-slate-600 hover:bg-slate-700 text-white text-sm mt-2">
                Recargar
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
