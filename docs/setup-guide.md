# 📋 Guía de Instalación - Zigurat Instagram MCP

Esta guía te llevará paso a paso para instalar y configurar el Zigurat Instagram MCP Server.

## 🔧 Prerrequisitos

Antes de comenzar, asegúrate de tener:

- **Node.js 18+** instalado en tu sistema
- **Claude Desktop** con soporte MCP habilitado
- **Cuenta Apify** (plan gratuito disponible)
- **Git** para clonar el repositorio

## 📥 Paso 1: Clonar el Repositorio

```bash
git clone https://github.com/PhelaoZi/zigurat-instagram-mcp.git
cd zigurat-instagram-mcp
```

## 📦 Paso 2: Instalar Dependencias

```bash
npm install
```

## 🔑 Paso 3: Configurar API Token de Apify

### 3.1 Crear cuenta en Apify

1. Ve a [apify.com](https://apify.com)
2. Crea una cuenta gratuita
3. Ve a Settings > Integrations
4. Copia tu API Token

### 3.2 Configurar variables de entorno

```bash
# Copiar archivo de ejemplo
cp .env.example .env

# Editar archivo .env
nano .env
```

Configurar las siguientes variables:

```env
# Token de API de Apify (REQUERIDO)
APIFY_API_TOKEN=tu_token_apify_aqui

# Configuración de Instagram (OPCIONAL - ya configurado para Zigurat)
ZIGURAT_INSTAGRAM_HANDLE=zigurat_cca
COMPETITORS_HANDLES=kunstmann_chile,tropera_brewing,ccu_artesanal

# Configuración de análisis (OPCIONAL)
MAX_POSTS_PER_ANALYSIS=50
ANALYSIS_FREQUENCY_HOURS=24

# Configuración de reportes (OPCIONAL)
REPORTS_OUTPUT_PATH=./data/reports
DATA_RETENTION_DAYS=90
```

## 🔨 Paso 4: Compilar el Proyecto

```bash
npm run build
```

## ⚙️ Paso 5: Configurar Claude Desktop

### 5.1 Localizar archivo de configuración

**En macOS:**
```bash
~/Library/Application Support/Claude/claude_desktop_config.json
```

**En Windows:**
```bash
%APPDATA%\Claude\claude_desktop_config.json
```

**En Linux:**
```bash
~/.config/Claude/claude_desktop_config.json
```

### 5.2 Agregar configuración MCP

Edita el archivo `claude_desktop_config.json` y agrega:

```json
{
  "mcpServers": {
    "zigurat-instagram": {
      "command": "node",
      "args": ["./build/index.js"],
      "cwd": "/ruta/completa/a/zigurat-instagram-mcp",
      "env": {
        "APIFY_API_TOKEN": "tu_token_apify_aqui"
      }
    }
  }
}
```

**⚠️ IMPORTANTE:** Reemplaza `/ruta/completa/a/zigurat-instagram-mcp` con la ruta absoluta real donde clonaste el proyecto.

### 5.3 Obtener ruta absoluta

**En macOS/Linux:**
```bash
pwd
```

**En Windows:**
```bash
cd
```

## 🧪 Paso 6: Probar la Instalación

### 6.1 Probar localmente

```bash
# Probar compilación
npm run build

# Probar servidor (opcional)
npm run inspector
```

### 6.2 Reiniciar Claude Desktop

1. Cierra completamente Claude Desktop
2. Ábrelo nuevamente
3. Verifica que aparezca el MCP en la interfaz

## ✅ Paso 7: Verificar Funcionamiento

En Claude Desktop, deberías poder usar comandos como:

```
"Claude, analiza el perfil de Instagram @zigurat_cca usando el MCP"
```

```
"Claude, compara Zigurat vs la competencia en Instagram"
```

```
"Claude, genera 5 sugerencias de contenido para Zigurat"
```

## 🔍 Resolución de Problemas

### Problema: "APIFY_API_TOKEN no está configurado"

**Solución:**
1. Verifica que el archivo `.env` existe
2. Confirma que `APIFY_API_TOKEN` está configurado
3. Reinicia Claude Desktop

### Problema: "Herramienta desconocida"

**Solución:**
1. Verifica que la compilación fue exitosa: `npm run build`
2. Confirma la ruta en `claude_desktop_config.json`
3. Reinicia Claude Desktop

### Problema: "Error conectando con Apify"

**Solución:**
1. Verifica tu token de Apify en [console.apify.com](https://console.apify.com)
2. Confirma que tienes conexión a internet
3. Verifica que no has excedido los límites del plan gratuito

### Problema: Rate limits o límites de API

**Solución:**
1. El MCP incluye rate limiting automático
2. Espera unos minutos entre análisis extensos
3. Considera upgrade a plan pagado de Apify si necesitas más capacidad

## 📊 Paso 8: Primeras Consultas Recomendadas

Una vez instalado, prueba estas consultas:

### Análisis Básico
```
"Claude, analiza el rendimiento del perfil @zigurat_cca en Instagram"
```

### Análisis Competitivo
```
"Claude, compara Zigurat con sus competidores en Instagram: @kunstmann_chile y @tropera_brewing"
```

### Análisis de Hashtags
```
"Claude, analiza los hashtags más efectivos para Zigurat: #cervezaartesanal, #craftbeer, #zigarutcca"
```

### Prospección de Clientes
```
"Claude, busca y evalúa bares potenciales en Santiago para Zigurat usando hashtags como #barsantiago y #cervezaartesanal"
```

### Generación de Contenido
```
"Claude, genera 3 sugerencias de contenido para Instagram de Zigurat enfocadas en productos"
```

## 🚀 Funcionalidades Avanzadas

### Configuración Personalizada

Puedes personalizar la configuración editando `src/config/index.ts` antes de compilar:

- Agregar más competidores
- Modificar productos de Zigurat
- Ajustar hashtags objetivo
- Cambiar ubicaciones target

### Automatización

El MCP incluye capacidades para:
- Análisis programados
- Reportes automáticos
- Alertas de tendencias
- Monitoreo competitivo

## 📞 Soporte

Si encuentras problemas:

1. **Revisa los logs**: Los errores aparecen en la consola de Claude Desktop
2. **Verifica la configuración**: Confirma todas las rutas y tokens
3. **Consulta la documentación**: Ver `README.md` para más detalles
4. **Issues en GitHub**: Reporta problemas en el repositorio

## 🎯 Próximos Pasos

Una vez instalado exitosamente:

1. Experimenta con las 5 herramientas principales
2. Personaliza los análisis para tu contexto
3. Establece rutinas de monitoreo
4. Documenta insights y mejoras identificadas

---

**🍺 ¡Felicitaciones! Ahora tienes el poder de la IA aplicada al análisis de Instagram para Zigurat CCA.**

*"Cerveza con Actitud, Data con Propósito"*
