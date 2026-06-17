# Guía de Uso — data-viewer

Flujo completo desde una idea hasta el código en producción.

---

## Parte 1 — Setup inicial (una sola vez)

### 1. Instalar prerequisitos

```bash
node --version    # necesitás 20.19.0+
npm --version     # necesitás 10+
gh --version      # GitHub CLI

# Instalar GitHub CLI si no lo tenés
brew install gh
gh auth login

# Instalar Claude Code
npm install -g @anthropic-ai/claude-code
claude --version
```

### 2. Inicializar git y subir a GitHub

```bash
cd /Users/diegocaro/Projects/data-viewer

git init -b main
git add .
git commit -m "chore: initialize data-viewer project scaffold"

gh repo create data-viewer --public --source=. --remote=origin --push
```

### 3. Configurar Jira MCP

```bash
# Obtener tu token en: https://id.atlassian.com/manage-profile/security/api-tokens

claude mcp add \
  --name jira \
  --transport http \
  "https://mcp.atlassian.com/v1/mcp" \
  --header "Authorization: Basic $(echo -n 'diego.caro999@gmail.com:TU_TOKEN' | base64)"

claude mcp list   # verificá que aparece "jira"
```

### 4. Abrir Claude Code en el proyecto

```bash
cd /Users/diegocaro/Projects/data-viewer
claude
```

Claude lee `CLAUDE.md` automáticamente y carga todas las reglas.

---

## Parte 2 — Flujo por cada feature

### Paso 1 — Dar la idea (BA la refina)

Escribís tu idea en lenguaje natural, lo más vaga que sea:

```
/enrich quiero mostrar los datos de la API en una tabla con filtros
```

O si ya hay un ticket en Jira:

```
/enrich SCRUM-1
```

**Qué hace Claude:**
1. Si diste un ID, busca el ticket en Jira
2. Te hace máximo 3 preguntas para entender mejor
3. Propone un draft con criterios de aceptación
4. Itera hasta que aprobés (máximo 3 rondas)
5. Actualiza el ticket en Jira con el contenido enriquecido
6. Mueve el ticket a "Ready for Dev"

**Ejemplo de interacción:**
```
Vos:    /enrich quiero filtrar datos por fecha

Claude: Tengo algunas preguntas:
        1. ¿Qué formato de fecha? (rango o día exacto)
        2. ¿El filtro es obligatorio o los datos se muestran sin filtro por defecto?
        3. ¿Dónde van los controles? (barra superior, sidebar, inline)

Vos:    rango de fechas, los datos se muestran sin filtro por defecto,
        controles en la barra superior

Claude: [propone ticket con criterios de aceptación]

Vos:    aprobado / necesito que también incluya exportar a CSV
```

---

### Paso 2 — Iniciar el desarrollo

Cuando el ticket está aprobado:

```
/develop SCRUM-1
```

**Qué hace Claude automáticamente:**
1. Verifica que el ticket esté en "Ready for Dev"
2. Mueve el ticket a "In Progress" en Jira
3. **Backend Dev** planifica la implementación:
   - Define types en `/lib/types/`
   - Escribe los tests primero (TDD)
   - Implementa el Route Handler y el Service
   - Verifica coverage ≥70%
4. **Frontend Dev** planifica la implementación:
   - Escribe los tests del componente
   - Implementa el componente Angular standalone
   - Maneja los 3 estados: loading / error / empty
   - Verifica coverage ≥70%
5. Lanza QA automáticamente

> **Nota**: Claude propone los planes en `.claude/doc/SCRUM-N/` antes de implementar. Podés revisarlos antes de que proceda.

---

### Paso 3 — QA automático

Se lanza solo después del desarrollo, o manualmente:

```
/qa SCRUM-1
```

**Qué hace Claude:**
1. Corre coverage de backend: `npx jest --testPathPattern="api|services" --coverage`
2. Corre coverage de frontend: `npx jest --testPathPattern="components|services|store" --coverage`
3. Si hay gaps → agrega tests hasta llegar al 70% (sin tocar la lógica)
4. Escribe los tests E2E en Cypress: `/cypress/e2e/SCRUM-1-feature.cy.ts`
5. Produce el reporte QA con resultados
6. Si todo pasa → lanza Review automáticamente

---

### Paso 4 — Code Review adversarial

Se lanza solo después de QA, o manualmente:

```
/review SCRUM-1
```

**Qué hace Claude:**
- Actúa como **revisor independiente** — no rubber-stamp, intenta encontrar fallas
- Verifica que cada criterio de aceptación esté realmente implementado
- Busca casos edge, estados de error, inputs inválidos
- Clasifica hallazgos: `[BLOCKER]` / `[MAJOR]` / `[MINOR]` / `[SUGGESTION]`

**Si es APPROVED:**
- Mueve ticket a "In Review — Approved"
- Lanza `update-docs` automáticamente
- Te pregunta: "¿Hago el commit y PR?"

**Si es CHANGES REQUESTED:**
- Lista todos los BLOCKERs con archivo y línea
- Mueve el ticket de vuelta a "In Progress"
- El agente de dev correspondiente corrige y se re-revisa

---

### Paso 5 — Documentación automática

Se lanza solo después del Review, o manualmente:

```
/update-docs SCRUM-1
```

Actualiza `docs/development-guide.md` con la feature completada, rutas nuevas, y decisiones de arquitectura.

---

### Paso 6 — Commit y PR

```
/commit SCRUM-1
```

**Qué hace Claude:**
1. Crea una branch: `SCRUM-1-nombre-feature`
2. Hace stage solo de los cambios del ticket
3. Escribe el commit con formato convencional:
   ```
   SCRUM-1: Add date range filter to data table

   - Add DateRangeFilter component with Tailwind styling
   - Add /api/data route with date query validation (Zod)
   - Add dataSourceService with filter params
   - 78% coverage backend, 74% coverage frontend
   ```
4. Push al remote
5. Crea el PR con link al ticket de Jira
6. Mueve el ticket a "Done" en Jira

**Modo dry-run** (solo ver el mensaje sin ejecutar git):
```
/commit SCRUM-1 dry run
```

---

## Parte 3 — Comandos de referencia

| Comando | Cuándo usarlo |
|---------|--------------|
| `/enrich [idea o SCRUM-N]` | Convertir una idea vaga en ticket refinado |
| `/develop SCRUM-N` | Implementar un ticket (backend + frontend + tests) |
| `/qa SCRUM-N` | Auditar coverage y escribir E2E tests |
| `/review SCRUM-N` | Code review adversarial |
| `/verify SCRUM-N` | Verificar que el código cumple los criterios del ticket |
| `/update-docs SCRUM-N` | Actualizar documentación manualmente |
| `/commit SCRUM-N` | Commit + PR + mover ticket a Done |
| `/audit` | Auditoría completa de calidad (dead code, deuda técnica) |
| `/worktree` | Aislar trabajo en paralelo con git worktrees |

---

## Parte 4 — Flujo paralelo (avanzado)

Si querés que backend y frontend trabajen al mismo tiempo en branches separadas:

```
/worktree
```

Claude crea un worktree aislado para cada agente, los cambios no interfieren entre sí, y los une al final.

Útil cuando tenés múltiples tickets en paralelo o querés que un agente trabaje en una feature mientras el otro revisa otra.

---

## Parte 5 — Auditoría de calidad

Cuando el proyecto crezca o antes de un release importante:

```
/audit
```

Claude ejecuta 6 fases:
1. **Pre-análisis**: lee config, corre linters como baseline
2. **Discovery**: mapea todos los archivos por capa
3. **Análisis archivo por archivo**: dead code, anti-patterns, TypeScript issues
4. **Verificación de best practices**: Angular 18, Next.js 14
5. **Detección automática**: `knip` para exports sin uso
6. **Reporte**: priorizado por criticidad, guardado en `docs/audit-YYYY-MM-DD.md`

---

## Parte 6 — Tips

**El flujo es incremental, no perfecto desde el inicio.**
No necesitás definir el endpoint de la API antes de empezar. Podés enriquecer tickets con lo que sabés hoy y completar `docs/api-spec.yml` cuando lo tengas.

**Claude recuerda el contexto del ticket.**
Cuando hacés `/develop SCRUM-1`, Claude lee el ticket enriquecido de Jira. Toda la info que pusiste en `/enrich` llega automáticamente al desarrollo.

**Podés intervenir en cualquier momento.**
Si el Review tiene CHANGES REQUESTED y querés resolver algo vos mismo:
```
ya lo arreglé, re-revisar
```

**Para ver el estado actual del backlog:**
```
qué hay en el backlog
```

**Para ver el estado de un ticket:**
```
estado de SCRUM-1
```

**Coverage por debajo de 70%:**
Claude QA lo detecta y agrega tests. Si no puede llegar al 70% con tests (el código tiene un gap de lógica), te avisa antes de continuar.
