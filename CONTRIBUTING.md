# 🤝 Guía de Contribución - Zigurat Instagram MCP

> ¡Gracias por tu interés en contribuir al proyecto! Toda ayuda es bienvenida.

## 🎯 Tipos de Contribuciones

### 🐛 **Bug Reports**
- Reportar errores en el funcionamiento
- Problemas de compatibilidad
- Documentación incorrecta

### 💡 **Feature Requests**
- Nuevas herramientas de análisis
- Mejoras en algoritmos existentes
- Integraciones con otras APIs

### 📚 **Documentación**
- Mejorar guías existentes
- Agregar ejemplos de uso
- Traducir documentación

### 🔧 **Código**
- Fix de bugs
- Implementación de nuevas features
- Optimizaciones de performance
- Tests unitarios

## 🚀 Getting Started

### Prerrequisitos
```bash
# Node.js 18+
node --version

# pnpm (recomendado)
npm install -g pnpm

# Git
git --version
```

### Setup del Proyecto
```bash
# 1. Fork y clonar
git clone https://github.com/TU_USERNAME/zigurat-instagram-mcp.git
cd zigurat-instagram-mcp

# 2. Instalar dependencias
pnpm install

# 3. Configurar environment
cp .env.example .env
# Editar .env con tu APIFY_API_TOKEN

# 4. Compilar
pnpm run build

# 5. Ejecutar tests (cuando estén disponibles)
npm test
```

## 📋 Proceso de Desarrollo

### 1. **Crear Branch**
```bash
# Para nuevas features
git checkout -b feature/nombre-descriptivo

# Para bug fixes
git checkout -b fix/descripcion-del-bug

# Para documentación
git checkout -b docs/tema-documentacion
```

### 2. **Desarrollo**
- Escribir código siguiendo los estándares del proyecto
- Agregar tests cuando sea aplicable
- Actualizar documentación si es necesario
- Seguir convenciones de naming

### 3. **Testing**
```bash
# Lint del código
pnpm run lint

# Compilación
pnpm run build

# Tests (cuando estén implementados)
pnpm test

# Test manual con inspector
pnpm run inspector
```

### 4. **Commit**
```bash
# Staging
git add .

# Commit con mensaje descriptivo
git commit -m "tipo: descripción breve del cambio"

# Ejemplos:
git commit -m "feat: add sentiment analysis for comments"
git commit -m "fix: resolve rate limiting issue with Apify API"
git commit -m "docs: update installation guide for Windows"
```

### 5. **Pull Request**
```bash
# Push branch
git push origin feature/nombre-descriptivo

# Crear PR en GitHub con:
# - Título descriptivo
# - Descripción detallada de cambios
# - Screenshots si aplica
# - Link a issues relacionados
```

## 📏 Estándares de Código

### TypeScript Guidelines
```typescript
// ✅ Bueno: Tipos explícitos para parámetros públicos
export async function analyzeProfile(
  username: string, 
  maxPosts: number = 50
): Promise<ProfileAnalysisResult> {
  // ...
}

// ✅ Bueno: Interfaces bien definidas
interface InstagramPost {
  id: string;
  caption: string;
  likesCount: number;
  // ...
}

// ❌ Malo: any sin justificación
function processData(data: any): any {
  // ...
}
```

### Naming Conventions
```typescript
// Variables y funciones: camelCase
const engagementRate = calculateEngagement();

// Interfaces y Types: PascalCase
interface ProfileAnalysis {}
type AnalysisResult = {};

// Constantes: UPPER_SNAKE_CASE
const MAX_POSTS_PER_REQUEST = 100;

// Archivos: kebab-case
// analyze-profile.ts
// instagram-analytics.ts
```

### Error Handling
```typescript
// ✅ Bueno: Error handling específico
try {
  const result = await apifyService.extractProfile(username);
  return result;
} catch (error) {
  if (error.code === 'RATE_LIMITED') {
    throw new McpError(ErrorCode.RateLimited, 'API rate limit exceeded');
  }
  throw new McpError(ErrorCode.InternalError, `Failed to analyze profile: ${error.message}`);
}

// ❌ Malo: Error genérico
try {
  // ...
} catch (error) {
  throw error; // No agregar valor
}
```

## 🧪 Testing Guidelines

### Unit Tests (Futuro)
```typescript
// Ejemplo de test esperado
describe('InstagramAnalytics', () => {
  it('should calculate engagement rate correctly', () => {
    const analytics = new InstagramAnalytics(mockApifyService);
    const result = analytics.calculateEngagementRate(100, 10, 1000);
    expect(result).toBe(11); // (100 + 10) / 1000 * 100
  });
});
```

### Integration Tests
```typescript
// Test con datos reales (usando cuenta de test)
it('should analyze real Instagram profile', async () => {
  const result = await analytics.analyzeProfile('test_account');
  expect(result.profile.username).toBe('test_account');
  expect(result.analytics.engagementRate).toBeGreaterThan(0);
});
```

## 📖 Documentación

### README Updates
- Mantener ejemplos actualizados
- Agregar nuevas features a la lista
- Actualizar screenshots si es necesario

### API Documentation
```typescript
/**
 * Analyze Instagram hashtag performance
 * 
 * @param username - Instagram username (without @)
 * @param timeframeDays - Days to look back (default: 30)
 * @returns Promise with hashtag analysis and recommendations
 * 
 * @example
 * ```typescript
 * const result = await analyzeHashtagPerformance('zigurat_cca', 30);
 * console.log(result.recommendations.topPerforming);
 * ```
 */
export async function analyzeHashtagPerformance(
  username: string,
  timeframeDays: number = 30
): Promise<HashtagAnalysis> {
  // ...
}
```

### Changelog
- Agregar entry para cada PR
- Categorizar como Added/Changed/Fixed/Deprecated
- Incluir breaking changes con ejemplos

## 🎨 Design Principles

### 1. **Zigurat-First**
- Optimizar para caso de uso de Zigurat
- Pero mantener flexibilidad para otras cervecerías

### 2. **Data-Driven**
- Decisiones basadas en métricas reales
- Algoritmos transparentes y explicables

### 3. **User-Friendly**
- Comandos naturales en español
- Respuestas claras y accionables
- Documentación comprensible

### 4. **Performance**
- Minimizar API calls con cache inteligente
- Rate limiting respetuoso
- Tiempos de respuesta rápidos

## 🔍 Code Review Process

### Qué Buscar
- ✅ Funcionalidad correcta
- ✅ Manejo de errores apropiado
- ✅ Performance acceptable
- ✅ Documentación actualizada
- ✅ Tests cuando aplique
- ✅ Consistencia con estilo del proyecto

### Review Checklist
- [ ] El código compila sin errores
- [ ] Los tests pasan (cuando existan)
- [ ] La documentación está actualizada
- [ ] No hay hardcoded secrets
- [ ] Rate limiting está respetado
- [ ] Error messages son útiles
- [ ] Performance es aceptable

## 🐛 Bug Report Template

```markdown
## Bug Description
Descripción clara y concisa del bug.

## Steps to Reproduce
1. Ejecutar comando '...'
2. Con parámetros '...'
3. Ver error

## Expected Behavior
Qué esperabas que pasara.

## Actual Behavior
Qué pasó realmente.

## Environment
- OS: [e.g. macOS 14.0]
- Node.js: [e.g. 18.17.0]
- MCP Version: [e.g. 1.0.0]
- Claude Desktop: [e.g. 1.2.3]

## Additional Context
Cualquier contexto adicional, screenshots, logs, etc.
```

## 💡 Feature Request Template

```markdown
## Feature Description
Descripción clara de la feature solicitada.

## Use Case
¿Por qué esta feature sería útil? ¿Qué problema resuelve?

## Proposed Solution
Cómo crees que debería implementarse.

## Alternatives Considered
Otras alternativas que consideraste.

## Additional Context
Ejemplos, mockups, referencias, etc.
```

## 🏆 Recognition

Contributors destacados serán:
- Mencionados en el README
- Incluidos en release notes
- Invitados a probar nuevas features early

## 📞 Contacto

¿Preguntas sobre contribución?
- 📧 Email: contacto@zigurat.cl
- 💬 GitHub Issues: Para dudas técnicas
- 📱 Instagram: [@zigurat_cca](https://instagram.com/zigurat_cca)

---

🍺 **¡Gracias por hacer que Zigurat sea aún mejor!** 🎸