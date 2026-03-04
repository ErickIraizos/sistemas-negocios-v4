import { Metadata } from 'next';
import { ETLTransform } from '@/components/etl-transform';
import { Sidebar } from '@/components/sidebar';

export const metadata: Metadata = {
  title: 'ETL - NeonData',
  description: 'Transforma y consulta datos de otras bases de datos',
};

export default function Page() {
  return (
    <div className="flex min-h-screen bg-slate-950">
      <Sidebar currentPath="/etl/transform" />
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <ETLTransform />
        </div>
      </main>
    </div>
  );
}
