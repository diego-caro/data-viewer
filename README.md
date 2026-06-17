# data-viewer — Guía de Inicio

App que lee datos de una API externa y los visualiza de una forma diferente.

- **Jira**: https://petreles.atlassian.net/jira/software/projects/SCRUM/boards/1
- **GitHub**: https://github.com/diego-caro
- **Stack**: Next.js 14, Angular 18, TypeScript, Tailwind CSS

---

## Antes de empezar — Qué vas a tener al terminar esta guía

Un ecosistema donde vos das una idea en lenguaje natural y Claude:
1. La convierte en un ticket de Jira con criterios de aceptación
2. Vos revisás y aprobás (o pedís otra iteración)
3. Claude implementa el código con tests (70% coverage)
4. Genera commit + PR en GitHub
5. Cierra el ticket en Jira

---

## Paso 1 — Instalar los prerrequisitos

Abrí tu terminal y verificá que tenés todo instalado:

```bash
node --version    # necesitás 20.19.0 o superior
npm --version     # necesitás 10 o superior
git --version     # cualquier versión reciente
gh --version      # GitHub CLI — si no lo tenés, ver abajo
```

**Instalar GitHub CLI** (si no lo tenés):
```bash
# macOS
brew install gh

# Luego autenticarte con tu cuenta de GitHub
gh auth login
# → Elegí "GitHub.com" → "HTTPS" → "Login with a web browser"
```

**Instalar Claude Code** (el agente de Anthropic para terminal):
```bash
npm install -g @anthropic-ai/claude-code
```

Verificá que quedó instalado:
```bash
claude --version
```

---

## Paso 2 — Subir el proyecto a GitHub

Creá el repositorio en GitHub y conectalo:

```bash
# Posicionarte en la carpeta del proyecto
cd /Users/diegocaro/Projects/data-viewer

# Inicializar git (si no lo hiciste antes)
git init -b main

# Primer commit con todo el scaffold
git add .
git commit -m "chore: initialize data-viewer project scaffold"

# Crear el repo en GitHub y subir
gh repo create data-viewer --public --source=. --remote=origin --push
```

> El repo va a quedar en https://github.com/diego-caro/data-viewer

---

## Paso 3 — Configurar el Jira MCP

El Jira MCP le permite a Claude leer y escribir tickets en tu Jira sin que vos copies y pegues nada.

### 3a — Obtener tu API token de Jira

1. Ir a: https://id.atlassian.com/manage-profile/security/api-tokens
2. Click en **"Create API token"**
3. Dale un nombre: `claude-data-viewer`
4. Copiá el token (solo se muestra una vez)

### 3b — Configurar el MCP en Claude Code

Ejecutá este comando reemplazando los valores:

```bash
claude mcp add \
  --name jira \
  --transport http \
  "https://mcp.atlassian.com/v1/mcp" \
  --header "Authorization: Basic $(echo -n 'diego.caro999@gmail.com:TU_API_TOKEN_AQUI' | base64)"
```

> Reemplazá `TU_API_TOKEN_AQUI` con el token que copiaste en el paso anterior.

Verificá que quedó configurado:
```bash
claude mcp list
# Deberías ver "jira" en la lista
```

---

## Paso 4 — Arrancar Claude Code en el proyecto

```bash
cd /Users/diegocaro/Projects/data-viewer
claude
```

Claude Code lee automáticamente el `CLAUDE.md` y carga las reglas del proyecto.
Vas a ver algo como:
```
✓ Loaded CLAUDE.md
✓ Found 7 custom commands
>
```

---

## Paso 5 — El flujo de trabajo

### 5a — Dar una idea y generar el ticket

Escribí tu idea en lenguaje natural. No necesita ser perfecta:

```
/enrich quiero mostrar los datos que vienen de la API de forma de tabla con filtros
```

O si ya tenés un ticket en Jira:
```
/enrich SCRUM-1
```

**Qué pasa:**
- El agente BA te va a hacer 2-3 preguntas para entender mejor
- Respondé lo que puedas — con poca info también funciona
- Claude propone un draft del ticket
- Repetís hasta que estés conforme (máximo 3 rondas)

**Ejemplo de interacción:**
```
Vos: /enrich quiero mostrar datos de una API en una tabla

Claude (BA): Entendido. Tengo algunas preguntas:
  1. ¿Qué tipo de datos muestra la tabla? (ej: usuarios, productos, etc.)
  2. ¿Los filtros son por columna o hay una búsqueda global?
  3. ¿Necesitás paginación o carga infinita?

Vos: son registros de ventas, filtros por fecha y vendedor, paginación de 20 por página

Claude: [propone el ticket con criterios de aceptación]

Vos: se ve bien, aprobado
```

**Resultado:** ticket actualizado en Jira, status → "Ready for Dev"

---

### 5b — Revisar el ticket (tu decisión)

Antes de proceder, revisá el ticket en Jira:
https://petreles.atlassian.net/jira/software/projects/SCRUM/boards/1

Si necesitás otra iteración:
```
necesito que también incluya exportar a CSV
```

Claude actualiza el ticket y te muestra la nueva versión.

Si está bien:
```
está bien, comenzar desarrollo
```

---

### 5c — Iniciar el desarrollo

```
/develop SCRUM-1
```

**Qué pasa automáticamente:**
1. Backend Dev implementa la API route + unit tests
2. Frontend Dev implementa el componente + component tests
3. QA audita coverage (si hay gaps, los cierra)
4. QA escribe E2E tests con Cypress
5. Reviewer hace code review
6. Si hay issues críticos → vuelve al dev correspondiente
7. Docs se actualizan automáticamente

**Vos solo intervenís si el Reviewer pide tu aprobación final.**

---

### 5d — Hacer el commit y el PR

Después del review aprobado, Claude te pregunta:
```
Ticket SCRUM-1 aprobado y docs actualizados. ¿Hago el commit y PR?
```

Respondés:
```
sí
```

O podés lanzarlo manualmente:
```
/commit SCRUM-1
```

**Resultado:**
- Commit con mensaje convencional
- Branch pushed a GitHub
- PR creado con link al ticket de Jira
- Ticket movido a "Done" en Jira

---

## Referencia rápida de comandos

| Comando | Cuándo usarlo |
|---------|--------------|
| `/enrich [idea o SCRUM-N]` | Tenés una idea vaga y querés convertirla en ticket |
| `/develop SCRUM-N` | El ticket está aprobado y querés arrancar el desarrollo |
| `/qa SCRUM-N` | Querés correr QA manualmente |
| `/review SCRUM-N` | Querés pedir review manualmente |
| `/verify SCRUM-N` | Verificar que el código cumple los criterios del ticket |
| `/update-docs SCRUM-N` | Actualizar la documentación manualmente |
| `/commit SCRUM-N` | Hacer commit + PR para ese ticket |

---

## Estructura del proyecto (para referencia)

```
data-viewer/
├── CLAUDE.md                    ← reglas del proyecto (Claude las lee automáticamente)
├── .claude/
│   └── commands/                ← slash commands disponibles en Claude Code
├── docs/
│   ├── base-standards.md        ← estándares de código
│   ├── documentation-standards.md
│   ├── development-guide.md     ← guía técnica (se actualiza automáticamente)
│   ├── data-model.md            ← modelo de datos (actualizar cuando tengas el endpoint)
│   └── api-spec.yml             ← spec del endpoint (actualizar cuando lo tengas)
└── ai-specs/
    ├── agents/                  ← definición de cada rol
    │   ├── pm.md
    │   ├── ba.md
    │   ├── backend-developer.md
    │   ├── frontend-developer.md
    │   ├── qa-automation.md
    │   └── reviewer.md
    └── skills/                  ← flujos de trabajo
        ├── enrich/
        ├── develop/
        ├── qa/
        ├── review/
        ├── verify/
        ├── update-docs/
        └── commit/
```

---

## Próximos pasos cuando tengas el endpoint

Cuando conozcas la URL de la API que vas a consumir, actualizá estos dos archivos:

1. **`docs/api-spec.yml`** — documentá el endpoint, los parámetros y la respuesta
2. **`docs/data-model.md`** — documentá la forma de los datos que devuelve

Podés pedirle a Claude que lo haga por vos:
```
tengo el endpoint: https://api.ejemplo.com/ventas — devuelve un array de { id, fecha, vendedor, monto }. Actualizá la spec y el data model.
```

---

## Troubleshooting frecuente

**Claude no reconoce el comando `/enrich`**
→ Asegurate de estar en la carpeta del proyecto cuando corrés `claude`
→ Verificá que existe `.claude/commands/enrich.md`

**Jira MCP no funciona**
→ Verificá el token: `claude mcp list`
→ Regenerá el token en https://id.atlassian.com/manage-profile/security/api-tokens

**Coverage por debajo de 70%**
→ Normal al principio. Claude QA lo detecta y agrega los tests faltantes automáticamente.
→ Si el QA no puede llegar al 70% con tests, te va a avisar que hay un gap de lógica.

**Git push rechazado**
→ No hacer force push. Correr `git pull --rebase origin main` y luego volver a pushear.
