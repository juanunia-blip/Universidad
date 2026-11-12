#!/usr/bin/env bash
set -Eeuo pipefail

: "${SONAR_TOKEN:?Falta SONAR_TOKEN (GitHub Actions secret)}"
SONAR_HOST_URL="${SONAR_HOST_URL:-http://127.0.0.1:9000}"
SONAR_PROJECT_KEY="la-tarima"
OUT="${GITHUB_WORKSPACE:-$PWD}/evidencias/sonarqube"
mkdir -p "$OUT"

if ! curl --fail --silent --show-error "$SONAR_HOST_URL/api/system/status" | grep -q '"status":"UP"'; then
  echo 'ERROR: SonarQube no esta disponible en localhost:9000 o no esta UP.' >&2
  exit 1
fi

echo 'Ejecutando SonarScanner Docker contra SonarQube local...'
set +e
docker run --rm --network host \
  --user "$(id -u):$(id -g)" \
  -e HOME=/tmp \
  -e SONAR_USER_HOME=/tmp/.sonar \
  -e SONAR_HOST_URL="$SONAR_HOST_URL" \
  -e SONAR_TOKEN \
  -v "${GITHUB_WORKSPACE:-$PWD}:/usr/src" \
  -w /usr/src \
  sonarsource/sonar-scanner-cli:latest \
  > "$OUT/scanner.log" 2>&1
SCAN_STATUS=$?
set -e

# No activar 'set -x': evitar revelar datos en los logs.
tail -n 80 "$OUT/scanner.log"
printf 'scanner_exit_code=%s\ncommit=%s\nrun_id=%s\n' \
  "$SCAN_STATUS" "${GITHUB_SHA:-local}" "${GITHUB_RUN_ID:-manual}" \
  > "$OUT/metadata.txt"

# Solo exportar metricas si esta ejecucion genero una tarea de analisis.
TASK_FILE="${GITHUB_WORKSPACE:-$PWD}/.scannerwork/report-task.txt"
if [[ -f "$TASK_FILE" ]]; then
  cp "$TASK_FILE" "$OUT/report-task.txt"
  TASK_ID="$(sed -n 's/^ceTaskId=//p' "$TASK_FILE" | head -n 1)"
  if [[ -n "$TASK_ID" ]]; then
    curl --fail --silent --show-error -u "$SONAR_TOKEN:" \
      "$SONAR_HOST_URL/api/ce/task?id=$TASK_ID" \
      -o "$OUT/ce-task.json" || true
    if [[ -s "$OUT/ce-task.json" ]]; then
      ANALYSIS_ID="$(python3 - "$OUT/ce-task.json" <<'PY'
import json, sys
with open(sys.argv[1], encoding='utf-8') as f:
    print(json.load(f).get('task', {}).get('analysisId') or '')
PY
)"
      if [[ -n "$ANALYSIS_ID" ]]; then
        curl --fail --silent --show-error -u "$SONAR_TOKEN:" \
          "$SONAR_HOST_URL/api/qualitygates/project_status?analysisId=$ANALYSIS_ID" \
          -o "$OUT/quality-gate.json" || true
        curl --fail --silent --show-error -u "$SONAR_TOKEN:" \
          "$SONAR_HOST_URL/api/measures/component?component=$SONAR_PROJECT_KEY&metricKeys=bugs,vulnerabilities,code_smells,security_hotspots,coverage,duplicated_lines_density" \
          -o "$OUT/metricas.json" || true
      else
        echo 'La tarea aun no tiene analysisId; no se exportan metricas historicas como si fueran actuales.'
      fi
    fi
  fi
else
  echo 'No se encontro report-task.txt: no hay analisis confirmado para esta ejecucion.'
fi

exit "$SCAN_STATUS"
