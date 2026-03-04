import { Metadata } from 'next';
import { PruebaConexiones } from '@/components/prueba-conexiones';
import { Sidebar } from '@/components/sidebar';

export const metadata: Metadata = {
  title: 'Prueba de Conexiones - NeonData',
  description: 'Valida y prueba todas tus conexiones de bases de datos',
};

export default function Page() {
  return (
    <div className="flex min-h-screen bg-slate-950">
      <Sidebar currentPath="/etl/prueba" />
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <PruebaConexiones />
        </div>
      </main>
    </div>
  );
}
