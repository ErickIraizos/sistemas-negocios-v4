import { NextRequest, NextResponse } from 'next/server';

interface DBConnection {
  id: string;
  name: string;
  host: string;
  user: string;
  password: string;
  database: string;
  ssl: boolean;
  createdAt: string;
}

// Simulamos una BD en memoria (en producción usarías Redis o MongoDB)
const connections = new Map<string, DBConnection>();

export async function GET() {
  try {
    const connectionsList = Array.from(connections.values());
    return NextResponse.json({ connections: connectionsList });
  } catch (error) {
    console.error('Error fetching connections:', error);
    return NextResponse.json(
      { error: 'Error al obtener conexiones' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { host, user, password, database, ssl, name } = await request.json();

    // Validación básica
    if (!host || !user || !password || !database || !name) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    // Crear ID único
    const id = `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Guardar conexión
    const newConnection: DBConnection = {
      id,
      name,
      host,
      user,
      password,
      database,
      ssl: ssl || false,
      createdAt: new Date().toISOString(),
    };

    connections.set(id, newConnection);

    return NextResponse.json({ 
      success: true, 
      connection: newConnection,
      message: 'Conexión guardada exitosamente'
    });
  } catch (error) {
    console.error('Error creating connection:', error);
    return NextResponse.json(
      { error: 'Error al guardar conexión' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const connectionId = searchParams.get('id');

    if (!connectionId) {
      return NextResponse.json(
        { error: 'ID de conexión requerido' },
        { status: 400 }
      );
    }

    const deleted = connections.delete(connectionId);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Conexión no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Conexión eliminada'
    });
  } catch (error) {
    console.error('Error deleting connection:', error);
    return NextResponse.json(
      { error: 'Error al eliminar conexión' },
      { status: 500 }
    );
  }
}
