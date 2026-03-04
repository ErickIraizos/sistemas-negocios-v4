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
    // Obtener número de tablas
    const tablesResult = await pool.query(`
      SELECT COUNT(*) as count FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    const totalTables = parseInt(tablesResult.rows[0].count) || 0;

    // Obtener número de columnas
    const columnsResult = await pool.query(`
      SELECT COUNT(*) as count FROM information_schema.columns 
      WHERE table_schema = 'public'
    `);
    const totalColumns = parseInt(columnsResult.rows[0].count) || 0;

    // Obtener número de filas total
    const tablesListResult = await pool.query(`
      SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    `);
    
    let totalRows = 0;
    for (const table of tablesListResult.rows) {
      const rowResult = await pool.query(`SELECT COUNT(*) as count FROM "${table.tablename}"`);
      totalRows += parseInt(rowResult.rows[0].count) || 0;
    }

    return Response.json({
      status: 'En línea',
      totalTables,
      totalColumns,
      totalRows,
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    return Response.json({ error: 'Error al obtener estadísticas' }, { status: 500 });
  } finally {
    await pool.end();
  }
}
