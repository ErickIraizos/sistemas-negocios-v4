# 🔄 Transformación de Datos ETL: De Sucursales a BD Principal

## Resumen Ejecutivo

Este documento explica en detalle cómo el sistema **extrae, transforma y consolida datos** desde múltiples bases de datos de sucursales hacia la base de datos principal, implementando un proceso ETL (Extract, Transform, Load) completo y profesional.

---

## 📋 Índice

1. [Conceptos Básicos](#conceptos-básicos)
2. [Arquitectura ETL](#arquitectura-etl)
3. [Proceso de Transformación Paso a Paso](#proceso-de-transformación-paso-a-paso)
4. [Capas de Transformación](#capas-de-transformación)
5. [Ejemplos Prácticos](#ejemplos-prácticos)
6. [Validación y Control de Calidad](#validación-y-control-de-calidad)
7. [Consolidación Final](#consolidación-final)
8. [Troubleshooting](#troubleshooting)

---

## Conceptos Básicos

### ¿Qué es ETL?

**ETL** es un acrónimo que representa tres fases clave:

| Fase | Descripción | En Nuestro Sistema |
|------|-------------|-------------------|
| **Extract (Extraer)** | Obtener datos desde fuentes externas | Conexión a BDs de sucursales |
| **Transform (Transformar)** | Limpiar, validar, estandarizar datos | Normalización y consolidación |
| **Load (Cargar)** | Insertar datos en BD destino | Cargar en BD principal |

### Estructura del Sistema

```
┌─────────────────┐
│ Sucursal Centro │ (Grupo 1)
│  (PostgreSQL)   │
└────────┬────────┘
         │
┌────────▼─────────┐
│ Sucursal Norte   │ (Grupo 2)
│  (PostgreSQL)    │
└────────┬─────────┘
         │
┌────────▼─────────┐
│ Sucursal Sur     │ (Grupo 3)
│  (PostgreSQL)    │
└────────┬─────────┘
         │
         │ [Proceso ETL - Transformación]
         │
┌────────▼──────────────────────┐
│   BD PRINCIPAL (Grupo 4)       │
│     - Consolidada             │
│     - Normalizada             │
│     - Validada                │
│   (PostgreSQL)                │
└───────────────────────────────┘
         │
         ├─→ Gráficas
         ├─→ Análisis
         └─→ Reportes
```

---

## Arquitectura ETL

### Componentes Principales

#### 1. **Capa de Conexión**

Cada sucursal se conecta con credenciales independientes:

```typescript
// Ejemplo de credenciales
const sucursales = {
  grupo_1: {
    host: "db-sucursal-centro.local",
    port: 5432,
    database: "sucursal_centro",
    user: "admin_centro",
    password: "***"
  },
  grupo_2: {
    host: "db-sucursal-norte.local",
    port: 5432,
    database: "sucursal_norte",
    user: "admin_norte",
    password: "***"
  },
  // ... más sucursales
};
```

**Ubicación en código**: `/app/etl/insertar-db/page.tsx` - Formulario de conexión

#### 2. **Capa de Validación**

Antes de transformar, el sistema valida:

```
✓ Conexión activa a BD
✓ Usuario tiene permisos de lectura
✓ Tablas existen y son accesibles
✓ Esquema coincide (igual estructura)
✓ Timeout < 10 segundos
```

**Ubicación en código**: `/app/api/etl/test-connection/route.ts`

#### 3. **Capa de Extracción**

Se ejecuta un SELECT específico en cada sucursal:

```sql
-- Ejemplo: Extraer atenciones por especialidad
SELECT 
    sucursal,
    especialidad,
    COUNT(*) as total_atenciones,
    SUM(costo_total_bs) as costo_total_bs,
    AVG(costo_total_bs) as costo_promedio_bs
FROM atenciones
GROUP BY sucursal, especialidad
```

Cada sucursal retorna sus datos con su respectivo nombre de sucursal.

**Ubicación en código**: `/components/graficas.tsx` - `handleQuerySelect()`

#### 4. **Capa de Transformación**

Los datos se normalizan y estandarizan:

```typescript
// Proceso de transformación
const transformData = (rawData) => {
  return {
    // Normalizar tipos de datos
    numeric: parseFloat(rawData.costo_total_bs),
    
    // Estandarizar nombres
    sucursal: rawData.sucursal.toUpperCase().trim(),
    especialidad: rawData.especialidad.toUpperCase().trim(),
    
    // Validar rangos
    atenciones: Math.max(0, rawData.total_atenciones),
    
    // Agregar timestamps
    fecha_carga: new Date(),
    origen: "ETL"
  };
};
```

#### 5. **Capa de Consolidación**

Los datos de todas las sucursales se unifican en una sola estructura:

```typescript
// Consolidación de múltiples sucursales
const consolidarDatos = (datosSucursal1, datosSucursal2, datosSucursal3) => {
  return {
    rows: [
      ...datosSucursal1.rows,  // Grupo 1
      ...datosSucursal2.rows,  // Grupo 2
      ...datosSucursal3.rows,  // Grupo 3
      ...datosGrupo4.rows      // Grupo 4 (BD principal)
    ],
    columns: ["sucursal", "especialidad", "total_atenciones", ...],
    multiDBResults: {
      grupo_1: datosSucursal1,
      grupo_2: datosSucursal2,
      grupo_3: datosSucursal3,
      grupo_4: datosGrupo4
    }
  };
};
```

---

## Proceso de Transformación Paso a Paso

### 🔹 Paso 1: Conectar Sucursales

**Usuario hace**: Ir a `/etl/insertar-db` y llenar formulario

**Sistema hace**:
```typescript
// 1. Recibe credenciales
const creds = {
  nombre: "Sucursal Centro",
  host: "db.sucursal.local",
  database: "sucursal_db",
  user: "admin",
  password: "***"
};

// 2. Valida conexión
await testConnection(creds); // ✓ Conexión exitosa

// 3. Guarda en sessionStorage
sessionStorage.setItem('db_connections', JSON.stringify(creds));
```

**Archivo**: `/app/etl/insertar-db/page.tsx`

### 🔹 Paso 2: Explorar Estructura (Prueba)

**Usuario hace**: Ir a `/etl/prueba` y ver tablas disponibles

**Sistema hace**:
```typescript
// 1. Conecta a cada sucursal
const connection = new Client(creds);
await connection.connect();

// 2. Obtiene lista de tablas
const tables = await connection.query(`
  SELECT table_name 
  FROM information_schema.tables 
  WHERE table_schema = 'public'
`);

// 3. Obtiene estructura de cada tabla
const columns = await connection.query(`
  SELECT column_name, data_type 
  FROM information_schema.columns 
  WHERE table_name = $1
`, [tableName]);

// 4. Muestra al usuario
displayTables(tables);
```

**Archivo**: `/app/etl/prueba/page.tsx`

### 🔹 Paso 3: Ejecutar Consulta ETL

**Usuario hace**: Ir a `/etl` y escribir SELECT

**Sistema hace**:
```typescript
// 1. Valida que sea SELECT (no UPDATE, DELETE, etc)
validateQuery(sqlQuery); // ✓ Es SELECT

// 2. Ejecuta en CADA sucursal
const results = [];
for (let db of sucursales) {
  const conn = new Client(db.credentials);
  await conn.connect();
  
  // Ejecuta el mismo SELECT en cada BD
  const data = await conn.query(sqlQuery);
  results.push({
    db: db.name,
    rows: data.rows,
    columns: Object.keys(data.rows[0] || {})
  });
  
  await conn.end();
}

// 3. Consolida resultados
return consolidateResults(results);
```

**Archivo**: `/app/etl/page.tsx` - función `executeQuery()`

### 🔹 Paso 4: Visualizar en Gráficas

**Usuario hace**: Ir a `/gráficas` y seleccionar consulta ETL

**Sistema hace**:
```typescript
// 1. Obtiene datos ETL consolidados
const queryData = getETLQuery(queryId);

// 2. Procesa transformación
const transformed = {
  // Todos los datos de todas las sucursales unificados
  rows: [
    { sucursal: "Grupo 1", especialidad: "Cardiología", total: 100, ... },
    { sucursal: "Grupo 1", especialidad: "Neuro", total: 50, ... },
    { sucursal: "Grupo 2", especialidad: "Cardiología", total: 80, ... },
    { sucursal: "Grupo 4", especialidad: "Cardiología", total: 200, ... },
    // ... todos los registros
  ],
  multiDBResults: {
    grupo_1: { rows: [...], columns: [...] },
    grupo_2: { rows: [...], columns: [...] },
    grupo_4: { rows: [...], columns: [...] }
  }
};

// 3. Crea gráficas
renderChart(transformed);
```

**Archivo**: `/components/graficas.tsx` - `handleQuerySelect()`

---

## Capas de Transformación

### Capa 1: Limpieza de Datos

```typescript
const cleanData = (row) => {
  return {
    // Eliminar espacios en blanco
    sucursal: row.sucursal?.trim() ?? 'Sin especificar',
    
    // Convertir a mayúsculas
    especialidad: row.especialidad?.toUpperCase() ?? 'GENERAL',
    
    // Convertir tipos
    total_atenciones: parseInt(row.total_atenciones) || 0,
    costo_total_bs: parseFloat(row.costo_total_bs) || 0.0,
    
    // Eliminar valores nulos
    ...(row.otro_campo && { otro_campo: row.otro_campo })
  };
};
```

### Capa 2: Validación

```typescript
const validateRow = (row) => {
  const errors = [];
  
  // Validar que tenga campos obligatorios
  if (!row.sucursal) errors.push("Sucursal vacía");
  if (!row.especialidad) errors.push("Especialidad vacía");
  
  // Validar rangos numéricos
  if (row.total_atenciones < 0) errors.push("Atenciones negativas");
  if (row.costo_total_bs < 0) errors.push("Costo negativo");
  
  // Validar formato
  if (!/^\d+$/.test(row.total_atenciones)) {
    errors.push("Total atenciones no es número");
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    row
  };
};
```

### Capa 3: Enriquecimiento

```typescript
const enrichData = (row, context) => {
  return {
    ...row,
    
    // Agregar información de contexto
    origen: context.sourceDB,
    fecha_extraccion: new Date(),
    version_etl: "1.0",
    
    // Calcular campos derivados
    costo_unitario: row.costo_total_bs / row.total_atenciones,
    margen_estimado: row.costo_total_bs * 0.15 // 15% estimado
  };
};
```

### Capa 4: Deduplicación

```typescript
const deduplicateRows = (allRows) => {
  const seen = new Set();
  return allRows.filter(row => {
    // Crear clave única
    const key = `${row.sucursal}|${row.especialidad}`;
    
    if (seen.has(key)) {
      console.warn(`Duplicado detectado: ${key}`);
      return false; // Descartar
    }
    
    seen.add(key);
    return true;
  });
};
```

---

## Ejemplos Prácticos

### Ejemplo 1: Consolidar Atenciones por Especialidad

**Objetivo**: Ver total de atenciones de TODAS las sucursales agrupadas por especialidad

**SQL en ETL**:
```sql
SELECT 
    sucursal,
    especialidad,
    COUNT(*) as total_atenciones,
    SUM(costo_total_bs) as costo_total_bs,
    AVG(costo_total_bs) as costo_promedio_bs
FROM atenciones
WHERE fecha >= '2024-01-01'
GROUP BY sucursal, especialidad
ORDER BY sucursal, total_atenciones DESC
```

**Transformación**:
```
Extracción:
├─ Sucursal Centro: 150 registros
├─ Sucursal Norte: 85 registros  
├─ Sucursal Sur: 120 registros
└─ BD Principal: 200 registros
   ↓
Total consolidado: 555 registros

Transformación:
├─ Validación: 555/555 ✓
├─ Limpieza: Espacios, mayúsculas
├─ Conversión tipos: strings → números
└─ Deduplicación: 0 duplicados

Resultado:
┌─────────────────────────────────────────────────────────┐
│ Sucursal         │ Especialidad │ Total │ Costo Total   │
├──────────────────┼──────────────┼───────┼───────────────┤
│ Grupo 1          │ Cardiología  │ 42    │ 1,234,567.89  │
│ Grupo 1          │ Neurología   │ 28    │ 876,543.21    │
│ Grupo 2          │ Cardiología  │ 35    │ 1,050,000.00  │
│ ...              │ ...          │ ...   │ ...           │
│ Grupo 4 (TOTAL)  │ Cardiología  │ 156   │ 4,567,890.12  │
└─────────────────────────────────────────────────────────┘
```

### Ejemplo 2: Comparación de Costos por Sucursal

**SQL en ETL**:
```sql
SELECT 
    sucursal,
    SUM(costo_total_bs) as costo_total,
    COUNT(*) as num_atenciones,
    AVG(costo_total_bs) as costo_promedio,
    MIN(costo_total_bs) as costo_minimo,
    MAX(costo_total_bs) as costo_maximo
FROM atenciones
GROUP BY sucursal
```

**Resultado consolidado**:
```
Grupo 1 (Centro):  Costo Total: 4,234,567.89 | Atenciones: 150
Grupo 2 (Norte):   Costo Total: 3,876,543.21 | Atenciones: 85
Grupo 3 (Sur):     Costo Total: 5,123,456.78 | Atenciones: 120
Grupo 4 (BD Prin): Costo Total: 9,876,543.21 | Atenciones: 200
─────────────────────────────────────────────────────────────
TOTAL CONSOLIDADO: Costo: 23,111,110.09 | Atenciones: 555
```

### Ejemplo 3: Sanidad por Farmacología

**SQL en ETL**:
```sql
SELECT 
    sucursal,
    grupo_farmacologico,
    COUNT(*) as total_usos,
    SUM(costo_medicamentos_bs) as gasto_farmacologico
FROM medicamentos
GROUP BY sucursal, grupo_farmacologico
ORDER BY sucursal, gasto_farmacologico DESC
LIMIT 20
```

**Transformación y resultado**:
```
Extrae de cada sucursal → Consolida → Valida → Visualiza

Resultado en Gráficas:
- Gráfica de barras: Comparación de gasto por medicamento entre sucursales
- Escala normalizada (1-10): Proporcionalidad visual
- Tooltip: Valores reales (Bs)
```

---

## Validación y Control de Calidad

### Checklist de Transformación

Para cada carga ETL, se valida:

```typescript
const validationChecklist = {
  // 1. Integridad
  '✓ Conexiones activas': true,
  '✓ Todas las BDs responden': true,
  '✓ Timeout < 10 segundos': true,
  
  // 2. Completitud
  '✓ Número de registros > 0': true,
  '✓ Todas las columnas presentes': true,
  '✓ Sin valores NULL en PK': true,
  
  // 3. Consistencia
  '✓ Tipos de datos correctos': true,
  '✓ Rangos válidos': true,
  '✓ Sin duplicados': true,
  
  // 4. Conformidad
  '✓ Coincide con esquema': true,
  '✓ Valores en diccionario': true,
  '✓ Sin caracteres inválidos': true
};
```

### Reporte de Validación

```
╔════════════════════════════════════════════════╗
║     REPORTE DE TRANSFORMACIÓN ETL             ║
╠════════════════════════════════════════════════╣
║ Fecha: 2026-03-08 10:45:30                    ║
║ Consulta: Consolidar Atenciones por Espe...   ║
║                                               ║
║ EXTRACCIÓN:                                   ║
║   Sucursal Centro: 150 registros ✓            ║
║   Sucursal Norte:  85 registros  ✓            ║
║   Sucursal Sur:    120 registros ✓            ║
║   BD Principal:    200 registros ✓            ║
║                                               ║
║ VALIDACIÓN:                                   ║
║   Total: 555 registros                        ║
║   Errores: 0                                  ║
║   Duplicados: 0                               ║
║   Filas rechazadas: 0                         ║
║                                               ║
║ TRANSFORMACIÓN:                               ║
║   Registros limpios: 555 / 555 (100%)        ║
║   Tipos convertidos: ✓                        ║
║   Valores enriquecidos: ✓                     ║
║                                               ║
║ CONSOLIDACIÓN:                                ║
║   Datos unificados: ✓                         ║
║   Estructura normalizada: ✓                   ║
║   Listo para visualización: ✓                 ║
║                                               ║
║ RESULTADO: ✓ TRANSFORMACIÓN EXITOSA          ║
╚════════════════════════════════════════════════╝
```

---

## Consolidación Final

### Estructura de Datos Consolidados

```typescript
interface ConsolidatedData {
  // 1. Filas unificadas de todas las sucursales
  rows: Array<{
    sucursal: string;           // "Grupo 1", "Grupo 2", etc
    especialidad: string;       // Cardiología, Neurología, etc
    total_atenciones: number;   // Normalizado
    costo_total_bs: number;     // En Bolivianos
    costo_promedio_bs: number;  // Promedio
    [key: string]: any;         // Otros campos
  }>;
  
  // 2. Lista de columnas
  columns: string[];
  
  // 3. Resultados por BD (para comparativas)
  multiDBResults: {
    grupo_1: { rows: [], columns: [] };
    grupo_2: { rows: [], columns: [] };
    grupo_3: { rows: [], columns: [] };
    grupo_4: { rows: [], columns: [] };
  };
  
  // 4. Metadata
  metadata: {
    fecha_extraccion: Date;
    total_registros: number;
    registros_por_db: Record<string, number>;
    tiempo_procesamiento_ms: number;
    version_etl: string;
  };
}
```

### Flujo Visual Completo

```
┌─────────────────────────────────────────────────┐
│ 1. ENTRADA: Múltiples Bases de Datos            │
│    ├─ Sucursal 1: PostgreSQL                    │
│    ├─ Sucursal 2: PostgreSQL                    │
│    ├─ Sucursal 3: PostgreSQL                    │
│    └─ BD Principal: PostgreSQL                  │
└──────────────────┬──────────────────────────────┘
                   │ ▼
┌─────────────────────────────────────────────────┐
│ 2. EXTRACCIÓN: SELECT en cada BD                │
│    ├─ Conexión validada                         │
│    ├─ Query ejecutada                           │
│    └─ Datos obtenidos (SQL raw)                 │
└──────────────────┬──────────────────────────────┘
                   │ ▼
┌─────────────────────────────────────────────────┐
│ 3. TRANSFORMACIÓN: Procesar Datos              │
│    ├─ Limpieza (trim, uppercase)               │
│    ├─ Validación (tipos, rangos)               │
│    ├─ Enriquecimiento (campos derivados)       │
│    └─ Deduplicación                            │
└──────────────────┬──────────────────────────────┘
                   │ ▼
┌─────────────────────────────────────────────────┐
│ 4. CONSOLIDACIÓN: Unificar Datos               │
│    ├─ Combinar todas las filas                 │
│    ├─ Normalizar estructura                    │
│    └─ Crear vista única                        │
└──────────────────┬──────────────────────────────┘
                   │ ▼
┌─────────────────────────────────────────────────┐
│ 5. SALIDA: Datos Listos para Análisis          │
│    ├─ Estructura unificada                     │
│    ├─ Validado y limpio                        │
│    ├─ Historial ETL (verde) en consola         │
│    └─ Disponible para Gráficas                 │
└──────────────────┬──────────────────────────────┘
                   │ ▼
┌─────────────────────────────────────────────────┐
│ 6. VISUALIZACIÓN: Gráficas & Reportes          │
│    ├─ Barras comparativas                      │
│    ├─ Líneas de tendencia                      │
│    ├─ Análisis ejecutivos automáticos          │
│    └─ Exportable a PDF/Excel                   │
└─────────────────────────────────────────────────┘
```

---

## Troubleshooting

### Problema: "Error de conexión a BD de sucursal"

**Causas posibles**:
1. Credenciales incorrectas
2. Host/Puerto inaccesible
3. BD no existe
4. Usuario sin permisos

**Solución**:
```bash
# 1. Verificar conexión
psql -h HOST -p 5432 -U USER -d DATABASE

# 2. Si conecta, verificar que tablas existen
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

# 3. Ir a /etl/prueba y hacer "Probar conexión"
```

### Problema: "Query retorna 0 registros"

**Verificar**:
1. La tabla existe en la BD
2. El rango de fechas es correcto
3. Los WHERE filters son válidos

**Solución**:
```sql
-- Ejecutar directamente en la BD
SELECT COUNT(*) FROM tu_tabla;
SELECT * FROM tu_tabla LIMIT 5;
```

### Problema: "Tipo de dato no coincide"

**Causa**: Una columna tiene diferente tipo en otra sucursal

**Solución**:
```sql
-- Verificar tipos en cada BD
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'atenciones'
ORDER BY column_name;

-- Luego convertir en el SELECT
SELECT 
    CAST(costo_total AS NUMERIC) as costo_total_bs,
    ...
FROM atenciones;
```

### Problema: "Faltan datos de una sucursal"

**Verificar**:
1. ¿La BD está en sessionStorage?
2. ¿La conexión se validó correctamente?
3. ¿La query ejecuta sin error en esa BD?

**Debug**:
```typescript
// En consola del navegador
console.log(sessionStorage.getItem('db_connections'));
// Debe mostrar todas las sucursales conectadas
```

---

## Arquitectura del Código

### Estructura de Archivos Relevantes

```
/app
├─ /etl
│  ├─ /insertar-db/page.tsx        ← Conectar nuevas BDs
│  ├─ /prueba/page.tsx             ← Validar conexiones
│  └─ /page.tsx                    ← Ejecutar queries ETL
│
├─ /api/etl
│  ├─ /test-connection/route.ts    ← Validar BD
│  ├─ /get-tables/route.ts         ← Listar tablas
│  └─ /execute-query/route.ts      ← Ejecutar SELECT
│
├─ /gráficas/page.tsx              ← Visualizar datos ETL

/components
├─ graficas.tsx                    ← Lógica de consolidación
├─ etl-transform.tsx               ← Transformaciones (deprecado)
└─ dashboard.tsx                   ← Vista de datos
```

### Flujo de Datos en Código

```typescript
// 1. Usuario escribe SQL en /etl/page.tsx
const sqlQuery = "SELECT sucursal, especialidad, COUNT(*) ...";

// 2. Se envía a /api/etl/execute-query/route.ts
const response = await fetch('/api/etl/execute-query', {
  method: 'POST',
  body: JSON.stringify({ query: sqlQuery, databases: connectionList })
});

// 3. Backend ejecuta en CADA sucursal
// → Loop en cada conexión
// → Ejecuta el mismo SELECT
// → Retorna datos por BD

// 4. Frontend consolida en /components/graficas.tsx
const consolidatedData = {
  rows: [...result.grupo_1, ...result.grupo_2, ...result.grupo_4],
  multiDBResults: result
};

// 5. Se guarda en estado
setSelectedQuery(consolidatedData);

// 6. Se visualiza en gráfica
renderChart(consolidatedData);
```

---

## Seguridad en ETL

### Medidas Implementadas

```typescript
// 1. Solo SELECT permitido
if (!query.toUpperCase().startsWith('SELECT')) {
  throw new Error('Solo SELECT está permitido');
}

// 2. Validación de conexión antes de ejecutar
await testConnection(credentials); // ✓ Exitosa

// 3. Timeout en queries
const timeoutMs = 10000;
const result = await Promise.race([
  connection.query(sql),
  timeout(timeoutMs)
]);

// 4. Manejo de errores sin exposición
try {
  // ... query
} catch (error) {
  return { error: 'Error al ejecutar query', details: '***' };
}

// 5. Credenciales en sessionStorage (no localStorage)
sessionStorage.setItem('db_connections', JSON.stringify(creds));
```

---

## Casos de Uso Avanzados

### Caso 1: Sincronización Mensual

```
1. Primer domingo del mes → Ejecutar ETL
2. Extraer datos de todas sucursales
3. Comparar con mes anterior
4. Generar reporte automático
5. Alertar si hay anomalías > 20%
```

### Caso 2: Consolidación de Múltiples Giros

```
BD Principal ← Farmacia
            ← Clínica
            ← Laboratorio
            ← Veterinaria

→ Una sola consulta que consolida todo
→ Vista unificada de negocios
```

### Caso 3: Auditoría de Cambios

```
Cada transformación se registra:
- Fecha y hora
- Usuario
- Query ejecutada
- Registros procesados
- Errores encontrados
→ Disponible en Historial ETL
```

---

## Conclusión

El sistema ETL implementado en esta plataforma proporciona:

✅ **Extracción** confiable desde múltiples BDs  
✅ **Transformación** automática y validada  
✅ **Consolidación** en vista única  
✅ **Visualización** profesional en gráficas  
✅ **Auditoría** completa de procesos  

Todo esto sin necesidad de herramientas ETL complejas, directamente desde el navegador con seguridad garantizada.

---

## Recursos Adicionales

- **[README.md](./README.md)** - Visión general del proyecto
- **[ETL_GUIA.md](./ETL_GUIA.md)** - Guía paso a paso (si existe)
- **[INFORME.md](./INFORME.md)** - Documentación técnica

---

**Versión**: 1.0  
**Última actualización**: 2026-03-08  
**Componentes principales**: graficas.tsx, /api/etl/*, /etl/pages/
