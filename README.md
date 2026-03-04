# 📊 NeonData - Sistema Integral de Análisis de Bases de Datos

Una plataforma web moderna para consultar, transformar y analizar datos de múltiples bases de datos PostgreSQL con gráficas profesionales e informes ejecutivos automáticos.

## ✨ Características Principales

### 🔍 **Consultas y Análisis**
- Consola SQL interactiva para consultas en tiempo real
- Historial automático de consultas guardadas
- Visualización de estructura de BD (tablas, columnas, tipos)
- Soporte para parámetros dinámicos

### 📈 **Visualización Avanzada** (11 tipos de gráficas)
- **Una métrica**: Barras V/H, Línea, Pie, Área, Dispersión, Radar, Embudo, Árbol, Composición
- **Múltiples métricas**: Barras apiladas, Barras agrupadas, Multi-línea, Multi-área
- Selección inteligente del tipo según datos
- Gráficas interactivas con Recharts

### 📋 **Informes Ejecutivos Automáticos**
- Estadísticas principales (suma, promedio, máximo, mínimo, rango)
- Análisis de distribución (varianza, desviación, mediana, coeficiente de variación)
- Detalles por elemento con barras de progreso y porcentajes
- Interpretaciones profesionales según tipo de gráfica
- Recomendaciones estratégicas basadas en datos
- Listo para presentaciones ejecutivas

### 🔄 **Módulo ETL (Extract, Transform, Load)**
- **Insertar DB**: Conectar múltiples bases de datos con credenciales
- **ETL**: Extraer y transformar datos con editor SQL (solo SELECT)
- **Prueba**: Validar conexiones y explorar tablas
- Historial de consultas ETL diferenciado en verde
- Integración completa: resultados ETL se usan en gráficas
- Consolidación de datos desde múltiples fuentes

### 🛡️ **Seguridad**
- Solo SELECT permitido en ETL y Consola SQL
- Validación de conexiones antes de guardar
- Manejo de errores sin exposición de detalles internos
- Timeout de 10 segundos en conexiones
- Variables de entorno para credenciales

## 🚀 Inicio Rápido

### Requisitos
- Node.js 20+
- PostgreSQL 14+ (principal + secundarias para ETL)
- npm o pnpm

### Instalación

```bash
# Clonar el proyecto
cd neondata

# Instalar dependencias
pnpm install

# Configurar variables de entorno
# Crear .env.local y añadir:
# DATABASE_URL=postgresql://usuario:contraseña@localhost:5432/neondata

# Iniciar
pnpm dev

# Abrir en navegador
# http://localhost:3000
```

### Variables de Entorno (`.env.local`)

```env
# BD Principal (obligatoria)
DATABASE_URL=postgresql://usuario:contraseña@localhost:5432/neondata
```

Las credenciales de BDs secundarias se configuran en la interfaz de **Insertar DB**.

## 📱 Navegación

**Menú Principal**:
- 🏠 Dashboard - Resumen general
- 🗄️ Estructura DB - Explorar tablas
- 💻 Consola SQL - Ejecutar queries
- 📜 Historial - Todas las consultas
- 📊 Gráficas - Visualización y análisis

**Menú ETL**:
- 📄 **Insertar DB** - Conectar otras BDs
- ⚡ **ETL** - Extraer y transformar datos
- ✅ **Prueba** - Validar conexiones

## 📚 Documentación Completa

- **[INFORME.md](./INFORME.md)** - Documentación técnica detallada
  - Arquitectura y stack
  - APIs REST
  - Seguridad
  - Deployment

- **[ETL_GUIA.md](./ETL_GUIA.md)** - Guía paso a paso del ETL
  - Cómo conectar BDs
  - Ejemplos prácticos
  - Casos de uso avanzados
  - Troubleshooting

## 🏗️ Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| **Frontend** | Next.js 16, React 19, TypeScript |
| **Estilos** | Tailwind CSS v4, Shadcn/ui |
| **Gráficas** | Recharts |
| **Iconos** | Lucide React |
| **Backend** | Next.js API Routes |
| **BD** | PostgreSQL (pg driver) |
| **Validación** | TypeScript |

## 💡 Ejemplos de Uso

### Consulta Simple
```sql
SELECT categoría, COUNT(*) as cantidad
FROM productos
GROUP BY categoría
ORDER BY cantidad DESC
```
→ Gráfica de barras automática + informe

### ETL: Consolidar Sucursales
```
1. Conectar: "Sucursal Centro", "Sucursal Norte", "Sucursal Sur"
2. ETL: SELECT especialidad, SUM(costo) FROM atenciones GROUP BY especialidad
3. Cargar en BD principal con INSERT
4. Gráficas: Visualizar consolidación
5. Informe: Recomendaciones automáticas
```

### Análisis Comparativo
```sql
SELECT 
  sucursal,
  total_atenciones,
  total_servicios_bs,
  total_medicamentos_bs,
  costo_total_bs
FROM especialidades
WHERE fecha >= '2024-01-01'
```
→ Barras agrupadas: Comparación entre sucursales
→ Informe: Cuál sucursal es más rentable

## 🔄 Flujo ETL Completo

```
[BD Secundaria 1] ─┐
[BD Secundaria 2] ─┼─> [ETL: Extraer] ─> [Transformar] ─> [Insertar]
[BD Secundaria 3] ─┘                                           ↓
                                                        [BD Principal]
                                                               ↓
                                                        [Gráficas + Informes]
```

**Historial**:
- Consultas principales en azul
- Consultas ETL en verde 🟢
- Todos integrados en Gráficas

## 🔒 Seguridad

✅ **Implementado**:
- Solo SELECT permitido
- Validación de conexiones
- Timeout en queries (10 seg)
- Errores sin exposición de datos

🔐 **Para Producción**:
- Cifrar credenciales (bcrypt)
- Usar Redis/MongoDB para conexiones
- Implementar JWT
- Rate limiting
- Audit logging

## 📊 Casos de Uso

- **Consolidación**: Múltiples sucursales en una vista
- **BI**: Dashboards ejecutivos
- **Auditoría**: Historial de consultas ETL
- **Integración**: Importar datos legacy
- **Analytics**: Reportes automáticos

## 🐛 Troubleshooting

**"No se conecta a BD"**
```bash
# Verificar credenciales
psql -h host -U usuario -d database
```

**"Conexión ETL falla"**
1. Ir a /etl/prueba
2. Hacer clic en "Probar" para validar
3. Ver mensaje de error específico

**"Gráfica vacía"**
1. Verificar que la consulta devuelve datos
2. Asegurar columnas numéricas
3. Seleccionar tipo de gráfica adecuado

Ver **[ETL_GUIA.md](./ETL_GUIA.md)** para más detalles.

## 📚 Dependencias

```json
{
  "next": "^16.0.0",
  "react": "^19.0.0",
  "pg": "^8.11.0",
  "recharts": "^2.12.0",
  "tailwindcss": "^4.0.0",
  "lucide-react": "^0.408.0"
}
```

## 🎯 Roadmap

- [ ] Autenticación de usuarios
- [ ] Guardado de gráficas custom
- [ ] Alertas automáticas
- [ ] Exportar a Excel/PDF
- [ ] Scheduled queries
- [ ] Webhooks
- [ ] Multi-tenancy

## 📞 Soporte

**Documentación**:
- Técnica: `INFORME.md`
- ETL: `ETL_GUIA.md`
- Este archivo: Visión general

**Links**:
- PostgreSQL: https://www.postgresql.org/docs/
- Next.js: https://nextjs.org/docs
- Recharts: https://recharts.org/

## 📄 Licencia

Privada - Uso exclusivo

---

**Versión**: 1.0.0  
**Última actualización**: 2026-03-03  
**Desarrollado con ❤️ para análisis de datos moderno**
