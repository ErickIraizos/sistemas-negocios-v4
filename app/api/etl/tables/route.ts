import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

export async function POST(request: NextRequest) {
  try {
    const { host, user, password, database, ssl } = await request.json();

    if (!host || !user || !password || !database) {
      return NextResponse.json(
        { error: 'Faltan parámetros requeridos' },
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
      const result = await pool.query(`
        SELECT tablename FROM pg_tables 
        WHERE schemaname = 'public' 
        ORDER BY tablename ASC
      `);

      const tables = result.rows.map((row) => row.tablename);

      await pool.end();

      return NextResponse.json({
        success: true,
        tables,
      });
    } catch (queryError: any) {
      await pool.end().catch(() => {});

      console.error('Query error:', queryError);
      return NextResponse.json(
        {
          success: false,
          error: queryError.message || 'Error obteniendo tablas',
        },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Error in ETL tables:', error);
    return NextResponse.json(
      { error: 'Error obteniendo tablas: ' + error.message },
      { status: 500 }
    );
  }
}
