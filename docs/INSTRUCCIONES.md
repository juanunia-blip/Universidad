# Pipeline de validacion y seguridad - La Tarima

## Flujo

1. En `pull_request` hacia `main`, GitHub ejecuta solo `validate` (runner hospedado).
2. En `push` a `main` o `workflow_dispatch` en `main`, ejecuta `validate`.
3. Si `validate` pasa, se lanzan dos jobs independientes:
   - `sonar`: scanner Docker en runner `self-hosted` del Ubuntu que tiene SonarQube en `127.0.0.1:9000`.
   - `zap`: frontend, backend y MongoDB **temporales** en runner hospedado por GitHub, y ZAP Baseline.
4. GitHub publica artifacts (30 dias). SonarQube mantiene su historial en tu instancia local.

No se realiza despliegue, ni se ejecutan pruebas unitarias inexistentes. Agregarlas despues como jobs reales.

## Instalacion

Copiar `.github/`, `scripts/` y `sonar-project.properties` a la raiz del repositorio `La-Tarima`.
No copiar ni subir `.env`, tokens, `evidencias/`, `.scannerwork/` ni bases de datos.

Agregar al `.gitignore` de la raiz:

```
**/node_modules/
**/dist/
**/coverage/
**/.env
**/.env.*
!**/.env.example
.scannerwork/
evidencias/
sonarqube-local/
```

En GitHub > Settings > Secrets and variables > Actions:
- Secret `SONAR_TOKEN`: token NUEVO de SonarQube (revocar los tokens que se hayan pegado en chats).

En GitHub > Settings > Actions > Runners, registrar un runner **self-hosted** Linux x64
**en el mismo Ubuntu** donde esta SonarQube, con etiqueta adicional `latarima-sonar`.
El usuario del runner necesita permisos para ejecutar Docker, `curl` y `python3`.
Comprobar desde el usuario del runner:

```
curl -fsS http://127.0.0.1:9000/api/system/status
docker ps
```

Si el runner esta desconectado, el job `sonar` quedara en espera.
No habilitar self-hosted para codigo no confiable (PR de forks o colaboradores sin revisar).
Proteger la rama `main` y limitar permisos de escritura sobre los workflows.

## Evidencias

En GitHub > Actions > ejecucion > Artifacts:
- `la-tarima-dependencias-<run_id>`: npm audit JSON.
- `la-tarima-sonarqube-<run_id>`: logs, ID de tarea, estado Quality Gate, metricas.
- `la-tarima-owasp-zap-<run_id>`: HTML, JSON, Markdown, logs del entorno temporal.

Puedes descargar los artifacts a Ubuntu con `gh run download <RUN_ID> -D ./evidencias-descargadas`.
No subir reportes de seguridad completos al repositorio publico: pueden exponer rutas y configuraciones.

## Limites de estas pruebas

- ZAP Baseline realiza analisis pasivo del frontend en ejecucion; no equivale a un pentest.
- No se configuran credenciales de prueba ni exploracion autenticada de las rutas protegidas.
- El proyecto original no define `npm test`, por lo que no se inventa cobertura.
- El Quality Gate puede fallar por problemas reales; no desactivar el gate para simular aprobacion.
- El frontend compilado y MongoDB del job ZAP son efimeros y usan datos ficticios.
- Los jobs `validate` y `zap` usan minutos de runners hospedados por GitHub segun el plan;
  `sonar` usa CPU/almacenamiento del Ubuntu local.
