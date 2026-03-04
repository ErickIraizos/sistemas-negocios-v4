import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

export async function POST(request: NextRequest) {
  try {
    const { host, user, password, database, ssl, query } = await request.json();

    if (!host || !user || !password || !database || !query) {
      return NextResponse.json(
        { error: 'Faltan parámetros requeridos' },
        { status: 400 }
      );
    }

    // Validar que sea SELECT (seguridad)
    if (!query.trim().toUpperCase().startsWith('SELECT')) {
      return NextResponse.json(
        { error: 'Solo se permiten consultas SELECT en el módulo ETL' },
        { status: 400 }
      );
    }

    const pool = new Pool({
      host,
      user,
      password,
      database,
      ssl: ssl ? { rejectUnauthorized: false } : false,
      connectionTimeoutMillis: 10000,
    });

    try {
      const result = await pool.query(query);
      await pool.end();

      return NextResponse.json({
        success: true,
        rows: result.rows,
        columns: result.fields.map((f: any) => f.name),
        rowCount: result.rowCount,
      });
    } catch (queryError: any) {
      await pool.end().catch(() => {});
      
      console.error('Query error:', queryError);
      return NextResponse.json(
        { 
          success: false,
          error: queryError.message || 'Error en la consulta',
          code: queryError.code
        },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Error in ETL query:', error);
    return NextResponse.json(
      { error: 'Error en consulta ETL: ' + error.message },
      { status: 500 }
    );
  }
}
