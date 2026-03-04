import { Pool } from 'pg';

export async function GET() {
  const pool = new Pool({
    host: process.env.DB1_HOST,
    user: process.env.DB1_USER,
    password: process.env.DB1_PASSWORD,
    database: process.env.DB1_NAME,
    ssl: process.env.DB1_SSL === 'true' ? { rejectUnauthorized: false } : false,
  });

  try {
    // Obtener lista de tablas
    const tablesResult = await pool.query(`
      SELECT tablename FROM pg_tables WHERE schemaname = 'public'
      ORDER BY tablename
    `);

    const tables = [];

    for (const table of tablesResult.rows) {
      const tableName = table.tablename;
      
      // Obtener columnas de la tabla
      const columnsResult = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = $1
        ORDER BY ordinal_position
      `, [tableName]);

      // Obtener primeros 5 registros
      const dataResult = await pool.query(`
        SELECT * FROM "${tableName}" LIMIT 5
      `);

      tables.push({
        name: tableName,
        columns: columnsResult.rows.map(col => ({
          name: col.column_name,
          type: col.data_type,
        })),
        data: dataResult.rows,
      });
    }

    return Response.json({ tables });
  } catch (error) {
    console.error('Error obteniendo tablas:', error);
    return Response.json({ error: 'Error al obtener tablas' }, { status: 500 });
  } finally {
    await pool.end();
  }
}
