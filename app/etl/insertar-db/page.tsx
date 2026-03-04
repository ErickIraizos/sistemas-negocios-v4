import { Metadata } from 'next';
import { InsertarDB } from '@/components/insertar-db';
import { Sidebar } from '@/components/sidebar';

export const metadata: Metadata = {
  title: 'Insertar BD - NeonData',
  description: 'Conecta nuevas bases de datos',
};

export default function Page() {
  return (
    <div className="flex min-h-screen bg-slate-950">
      <Sidebar currentPath="/etl/insertar-db" />
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <InsertarDB />
        </div>
      </main>
    </div>
  );
}
