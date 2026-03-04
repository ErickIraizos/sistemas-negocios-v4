import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

export async function POST(request: NextRequest) {
  try {
    const { host, user, password, database, ssl } = await request.json();

    if (!host || !user || !password || !database) {
      return NextResponse.json(
        { error: 'Faltan parámetros de conexión' },
        { status: 400 }
      );
    }

    // Intentar conectar a la BD
    const pool = new Pool({
      host,
      user,
      password,
      database,
      ssl: ssl ? { rejectUnauthorized: false } : false,
      connectionTimeoutMillis: 5000,
    });

    try {
      const result = await pool.query('SELECT 1 as connection_test');
      await pool.end();

      return NextResponse.json({ 
        success: true,
        message: 'Conexión exitosa',
        connected: true
      });
    } catch (poolError: any) {
      await pool.end().catch(() => {});
      
      console.error('Pool error:', poolError);
      return NextResponse.json(
        { 
          success: false,
          error: poolError.message || 'Error al conectar a la base de datos',
          details: poolError.code
        },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Error validating connection:', error);
    return NextResponse.json(
      { error: 'Error en validación: ' + error.message },
      { status: 500 }
    );
  }
}
