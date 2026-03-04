'use client';

import { useState } from 'react';
import Link from 'next/link';
import { LayoutDashboard, Database, Code2, History, BarChart3, FileJson, Zap, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/',
    icon: <LayoutDashboard className="w-5 h-5" />,
  },
  {
    name: 'Estructura DB',
    href: '/estructura-db',
    icon: <Database className="w-5 h-5" />,
  },
  {
    name: 'Consola SQL',
    href: '/consola-sql',
    icon: <Code2 className="w-5 h-5" />,
  },
  {
    name: 'Historial',
    href: '/historial',
    icon: <History className="w-5 h-5" />,
  },
  {
    name: 'Gráficas',
    href: '/graficas',
    icon: <BarChart3 className="w-5 h-5" />,
  },
];

const etlItems: NavItem[] = [
  {
    name: 'Insertar DB',
    href: '/etl/insertar-db',
    icon: <FileJson className="w-5 h-5" />,
  },
  {
    name: 'ETL',
    href: '/etl/transform',
    icon: <Zap className="w-5 h-5" />,
  },
  {
    name: 'Prueba',
    href: '/etl/prueba',
    icon: <CheckCircle className="w-5 h-5" />,
  },
  {
    name: 'Gráficas vs',
    href: '/etl/graficas-vs',
    icon: <BarChart3 className="w-5 h-5" />,
  },
];

export function Sidebar({ currentPath }: { currentPath: string }) {
  return (
    <div className="w-64 bg-gradient-to-b from-slate-900 to-slate-950 border-r border-slate-700 h-screen flex flex-col sticky top-0">
      {/* Logo */}
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <Database className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-white text-lg">NeonData</h1>
            <p className="text-xs text-gray-400">Estudio de Base de Datos</p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
        {/* Principal */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">MENÚ</p>
          <div className="space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium',
                  currentPath === item.href
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-slate-800'
                )}
              >
                {item.icon}
                {item.name}
              </Link>
            ))}
          </div>
        </div>

        {/* ETL */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">ETL</p>
          <div className="space-y-2">
            {etlItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium',
                  currentPath === item.href
                    ? 'bg-orange-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-slate-800'
                )}
              >
                {item.icon}
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* Connection Status */}
      <div className="p-4 border-t border-slate-700">
        <div className="bg-slate-800 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <p className="text-xs font-semibold text-white">Conectado</p>
          </div>
          <p className="text-xs text-gray-400 truncate">
            ep-orange-sun-...neon.tech
          </p>
        </div>
      </div>
    </div>
  );
}
