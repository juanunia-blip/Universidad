
#!/usr/bin/env bash
set -Eeuo pipefail

# Ejecucion automatica desde el runner Ubuntu asociado a GitHub Actions.
# SonarQube debe estar en el mismo Ubuntu y responder en 127.0.0.1:9000.
ROOT="${GITHUB_WORKSPACE:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)}"
cd "$ROOT"

: "${SONAR_TOKEN:?Falta SONAR_TOKEN en GitHub Actions secrets}"
SONAR_HOST_URL="${SONAR_HOST_URL:-http://127.0.0.1:9000}"
OUT="$ROOT/evidencias/sonarqube"
mkdir -p "$OUT" "$ROOT/.scannerwork"

# No utilizar evidencia antigua en un runner persistente.
rm -f "$ROOT/.scannerwork/report-task.txt"

if ! docker info >/dev/null 2>&1; then
  echo 'ERROR: El usuario del runner no tiene acceso a Docker.' >&2
  exit 1
fi

STATUS="$(curl -fsS --max-time 15 "$SONAR_HOST_URL/api/system/status")"
if ! printf '%s' "$STATUS" | grep -Eq '"status"[[:space:]]*:[[:space:]]*"UP"'; then
  echo "ERROR: SonarQube no esta en estado UP: $STATUS" >&2
  exit 1
fi

echo 'SonarQube disponible. Iniciando SonarScanner (sin cobertura).'
SCAN_EXIT=0

# El token se transmite mediante variable de entorno, nunca mediante -Dsonar.token.
# Forzamos el directorio de trabajo montado para conservar report-task.txt.
docker run --rm \
  --network host \
  --user "$(id -u):$(id -g)" \
  -e HOME=/tmp \
  -e SONAR_USER_HOME=/tmp/.sonar \
  -e SONAR_HOST_URL="$SONAR_HOST_URL" \
  -e SONAR_TOKEN \
  -v "$ROOT:/usr/src" \
  -w /usr/src \
  sonarsource/sonar-scanner-cli:latest \
  -Dsonar.working.directory=/usr/src/.scannerwork \
  > "$OUT/scanner.log" 2>&1 || SCAN_EXIT=$?

tail -n 90 "$OUT/scanner.log"

printf 'scanner_exit_code=%s\ncommit=%s\nrun_id=%s\n' \
  "$SCAN_EXIT" "${GITHUB_SHA:-local}" "${GITHUB_RUN_ID:-manual}" \
  > "$OUT/metadata.txt"

if [[ -s "$ROOT/.scannerwork/report-task.txt" ]]; then
  cp "$ROOT/.scannerwork/report-task.txt" "$OUT/report-task.txt"
fi

if grep -q 'QUALITY GATE STATUS:' "$OUT/scanner.log"; then
  grep 'QUALITY GATE STATUS:' "$OUT/scanner.log" > "$OUT/quality-gate.txt"
fi

if [[ -n "${GITHUB_STEP_SUMMARY:-}" ]]; then
  {
    echo '## SonarQube - La Tarima'
    echo "Resultado del scanner: $SCAN_EXIT"
    if [[ -s "$OUT/quality-gate.txt" ]]; then
      cat "$OUT/quality-gate.txt"
    else
      echo 'No se recibio un resultado de Quality Gate.'
    fi
    echo 'Ver artifact la-tarima-sonarqube de esta ejecucion.'
  } >> "$GITHUB_STEP_SUMMARY"
fi

exit "$SCAN_EXIT"
