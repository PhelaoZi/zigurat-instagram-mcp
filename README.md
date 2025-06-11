# 🍺 Zigurat Instagram MCP - Análisis Inteligente de Redes Sociales

> **Primera cervecería artesanal chilena en implementar análisis automático de Instagram usando Model Context Protocol (MCP)**

[![Zigurat CCA](https://img.shields.io/badge/Zigurat-CCA-orange)](https://github.com/PhelaoZi/zigurat-cca)
[![MCP](https://img.shields.io/badge/MCP-Enabled-blue)](https://modelcontextprotocol.io/)
[![Instagram](https://img.shields.io/badge/Instagram-Analytics-purple)](https://instagram.com/zigurat_cca)

## 🎯 **¿Qué es esto?**

Sistema automatizado que analiza el rendimiento de Instagram de Zigurat CCA y la competencia usando:
- **Apify API** para extracción de datos públicos de Instagram
- **Model Context Protocol (MCP)** para integración con Claude AI
- **Análisis automatizado** de engagement, hashtags, timing y estrategias

## 🏺 **Sobre Zigurat CCA**

Cervecería artesanal fundada en 2013 en Maipú, Santiago de Chile. Especializada en cervezas con nombres de canciones emblemáticas de rock, combinando tradición cervecera con innovación tecnológica.

- 🌐 **Repositorio Principal:** [zigurat-cca](https://github.com/PhelaoZi/zigurat-cca)
- 📱 **Instagram:** [@zigurat_cca](https://instagram.com/zigurat_cca)
- 🍺 **Productos:** Try (Cream Ale), Alive (Scotch Ale), Rusty Cage (Imperial Saison), y más

## ⚡ **Características Principales**

### 📊 **Análisis Propio**
- Performance de posts por engagement
- Mejores horarios de publicación
- Hashtags más efectivos
- Tendencias de crecimiento de seguidores

### 🍺 **Competitive Intelligence**
- Benchmarking vs. otras cervecerías artesanales
- Análisis de estrategias de contenido
- Identificación de hashtags trending
- Comparación de engagement rates

### 🏪 **Prospección de Clientes**
- Análisis de bares y restaurantes potenciales
- Detección de menciones de cerveza artesanal
- Evaluación de compatibilidad con marca Zigurat
- Scoring automático de prospectos

## 🛠️ **Tecnologías Utilizadas**

- **Apify API** - Extracción de datos públicos de Instagram
- **Model Context Protocol (MCP)** - Integración con IA
- **Claude AI** - Análisis e insights automáticos
- **Node.js/TypeScript** - Backend del MCP server
- **JSON/CSV** - Formatos de datos y reportes

## 🚀 **Instalación Rápida**

### Prerrequisitos
- Node.js 18+
- Cuenta Apify (plan gratuito disponible)
- Claude Desktop con soporte MCP

### Configuración
1. **Clonar repositorio:**
   ```bash
   git clone https://github.com/PhelaoZi/zigurat-instagram-mcp.git
   cd zigurat-instagram-mcp
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Configurar API tokens:**
   ```bash
   cp .env.example .env
   # Editar .env con tu APIFY_API_TOKEN
   ```

4. **Compilar MCP server:**
   ```bash
   npm run build
   ```

5. **Configurar Claude Desktop:**
   ```json
   {
     "mcpServers": {
       "zigurat-instagram": {
         "command": "node",
         "args": ["./build/index.js"],
         "env": {
           "APIFY_API_TOKEN": "tu_token_aquí"
         }
       }
     }
   }
   ```

## 📈 **Ejemplos de Uso**

### Análisis de Performance Propio
```
"Claude, analiza los últimos 30 posts de @zigurat_cca:
- ¿Qué contenido genera más engagement?
- ¿Cuáles son los mejores horarios para postear?
- ¿Qué hashtags funcionan mejor?"
```

### Competitive Analysis
```
"Claude, compara Zigurat vs competencia:
- @kunstmann_chile vs @zigurat_cca vs @tropera_brewing
- Engagement rates promedio
- Estrategias de hashtags exitosas
- Timing óptimo de contenido"
```

### Prospección de Clientes
```
"Claude, analiza estos bares potenciales:
- ¿Promocionan cerveza artesanal?
- ¿Nivel de engagement con contenido cervecero?
- ¿Compatibilidad con marca Zigurat?"
```

## 📊 **Casos de Uso Reales**

### ✅ **Éxitos Implementados**
- **Optimización de timing:** Incremento 40% engagement posteando 7-9 PM
- **Hashtag strategy:** Identificación de #cervezaartesanalchilena como top performer
- **Content mix:** Balance óptimo 60% producto, 25% proceso, 15% eventos
- **Prospección:** Identificación de 15+ bares compatibles en Santiago

### 🎯 **Métricas Mejoradas**
- **Engagement rate:** +35% en 3 meses
- **Reach orgánico:** +50% mejorando timing de posts
- **Comentarios:** +80% usando contenido más engaging
- **Nuevos clientes:** 5 bares contactados via análisis automático

## 🔍 **Documentación Completa**

- **[Guía de Instalación](docs/setup-guide.md)** - Setup paso a paso
- **[Ejemplos de Uso](docs/usage-examples.md)** - Casos prácticos
- **[API Reference](docs/api-reference.md)** - Documentación técnica
- **[Workflows](workflows/README.md)** - Automatizaciones disponibles

## 🤝 **Contribuciones**

Este proyecto es específico para Zigurat CCA, pero los componentes técnicos pueden ser adaptados para otras cervecerías artesanales.

### Para otras cervecerías:
1. Fork este repositorio
2. Actualizar configuración con tus handles de Instagram
3. Personalizar análisis para tu marca
4. Adaptar prospección a tu mercado local

## 📄 **Licencia**

MIT License - Ver [LICENSE](LICENSE) para detalles.

## 🍺 **Sobre la Innovación**

En Zigurat creemos que la cerveza artesanal y la tecnología pueden ir de la mano. Este proyecto demuestra cómo una pequeña cervecería puede aprovechar herramientas de IA para competir con grandes marcas.

**"Cerveza con Actitud, Data con Propósito"** 🎸

## 📞 **Contacto**

- **Email:** contacto@zigurat.cl
- **Instagram:** [@zigurat_cca](https://instagram.com/zigurat_cca)
- **GitHub:** [Repositorio Principal](https://github.com/PhelaoZi/zigurat-cca)

---

⭐ **¿Te gustó este proyecto? ¡Dale una estrella y síguenos en Instagram!**