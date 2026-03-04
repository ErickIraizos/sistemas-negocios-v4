import { Pool } from 'pg';

export async function POST(request: Request) {
  const pool = new Pool({
    host: process.env.DB1_HOST,
    user: process.env.DB1_USER,
    password: process.env.DB1_PASSWORD,
    database: process.env.DB1_NAME,
    ssl: process.env.DB1_SSL === 'true' ? { rejectUnauthorized: false } : false,
  });

  try {
    const { query } = await request.json();

    if (!query || typeof query !== 'string') {
      return Response.json(
        { error: 'Query es requerida' },
        { status: 400 }
      );
    }

    // Validar que sea solo SELECT para seguridad
    const trimmedQuery = query.trim().toUpperCase();
    if (!trimmedQuery.startsWith('SELECT')) {
      return Response.json(
        { error: 'Solo se permiten consultas SELECT' },
        { status: 400 }
      );
    }

    const result = await pool.query(query);

    return Response.json({
      columns: result.fields?.map(f => f.name) || [],
      rows: result.rows,
      rowCount: result.rowCount,
    });
  } catch (error: any) {
    console.error('Error ejecutando query:', error);
    return Response.json(
      { error: error.message || 'Error al ejecutar consulta' },
      { status: 500 }
    );
  } finally {
    await pool.end();
  }
}
