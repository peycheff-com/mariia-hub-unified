{{/*
Expand the name of the chart.
*/}}
{{- define "mariia-hub.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "mariia-hub.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "mariia-hub.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "mariia-hub.labels" -}}
helm.sh/chart: {{ include "mariia-hub.chart" . }}
{{ include "mariia-hub.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- if .Values.commonLabels }}
{{ toYaml .Values.commonLabels }}
{{- end }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "mariia-hub.selectorLabels" -}}
app.kubernetes.io/name: {{ include "mariia-hub.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- if .Values.podLabels }}
{{ toYaml .Values.podLabels }}
{{- end }}
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "mariia-hub.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "mariia-hub.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}

{{/*
Create image name
*/}}
{{- define "mariia-hub.image" -}}
{{- $registry := .Values.image.registry -}}
{{- $repository := .Values.image.repository -}}
{{- $tag := .Values.image.tag | default .Chart.AppVersion -}}
{{- if .Values.global.imageRegistry }}
{{- $registry = .Values.global.imageRegistry -}}
{{- end }}
{{- printf "%s/%s:%s" $registry $repository $tag -}}
{{- end }}

{{/*
Create the name of the configmap to use
*/}}
{{- define "mariia-hub.configMapName" -}}
{{- if .Values.configMaps.existingConfigMap }}
{{- .Values.configMaps.existingConfigMap }}
{{- else }}
{{- printf "%s-config" (include "mariia-hub.fullname" .) }}
{{- end }}
{{- end }}

{{/*
Create the name of the secret to use
*/}}
{{- define "mariia-hub.secretName" -}}
{{- if .Values.secrets.existingSecret }}
{{- .Values.secrets.existingSecret }}
{{- else }}
{{- printf "%s-secrets" (include "mariia-hub.fullname" .) }}
{{- end }}
{{- end }}

{{/*
Return the proper Docker Image Registry Secret Names
*/}}
{{- define "mariia-hub.imagePullSecrets" -}}
{{- include "common.images.pullSecrets" (dict "images" (list .Values.image) "global" .Values.global) -}}
{{- end }}

{{/*
Create the name of the service
*/}}
{{- define "mariia-hub.serviceName" -}}
{{- printf "%s-service" (include "mariia-hub.fullname" .) }}
{{- end }}

{{/*
Create the name of the hpa
*/}}
{{- define "mariia-hub.hpaName" -}}
{{- printf "%s-hpa" (include "mariia-hub.fullname" .) }}
{{- end }}

{{/*
Create the name of the pdb
*/}}
{{- define "mariia-hub.pdbName" -}}
{{- printf "%s-pdb" (include "mariia-hub.fullname" .) }}
{{- end }}

{{/*
Create the name of the network policy
*/}}
{{- define "mariia-hub.networkPolicyName" -}}
{{- printf "%s-netpol" (include "mariia-hub.fullname" .) }}
{{- end }}

{{/*
Return the storage class name
*/}}
{{- define "mariia-hub.storageClass" -}}
{{- if .Values.persistence.storageClass }}
{{- .Values.persistence.storageClass }}
{{- else if .Values.global.storageClass }}
{{- .Values.global.storageClass }}
{{- else }}
""
{{- end }}
{{- end }}

{{/*
Validate values
*/}}
{{- define "mariia-hub.validateValues" -}}
{{- $messages := list -}}
{{- if not .Values.env -}}
{{- $messages = append $messages "Environment variables are required" -}}
{{- end -}}
{{- if not .Values.image.repository -}}
{{- $messages = append $messages "Image repository is required" -}}
{{- end -}}
{{- if $messages -}}
{{- printf "\nVALUES VALIDATION:\n%s" (join "\n" $messages) | fail -}}
{{- end -}}
{{- end }}

{{/*
Create a default fully qualified postgresql name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
*/}}
{{- define "mariia-hub.postgresql.fullname" -}}
{{- if .Values.postgresql.fullnameOverride -}}
{{- .Values.postgresql.fullnameOverride | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- $name := default "postgresql" .Values.postgresql.nameOverride -}}
{{- if contains $name .Release.Name -}}
{{- .Release.Name | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" -}}
{{- end -}}
{{- end -}}
{{- end -}}

{{/*
Create a default fully qualified redis name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
*/}}
{{- define "mariia-hub.redis.fullname" -}}
{{- if .Values.redis.fullnameOverride -}}
{{- .Values.redis.fullnameOverride | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- $name := default "redis" .Values.redis.nameOverride -}}
{{- if contains $name .Release.Name -}}
{{- .Release.Name | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" -}}
{{- end -}}
{{- end -}}
{{- end -}}

{{/*
Return the PostgreSQL secret name
*/}}
{{- define "mariia-hub.postgresql.secretName" -}}
{{- if .Values.postgresql.auth.existingSecret -}}
{{- .Values.postgresql.auth.existingSecret -}}
{{- else -}}
{{- printf "%s" (include "mariia-hub.postgresql.fullname" .) -}}
{{- end -}}
{{- end -}}

{{/*
Return the Redis secret name
*/}}
{{- define "mariia-hub.redis.secretName" -}}
{{- if .Values.redis.auth.existingSecret -}}
{{- .Values.redis.auth.existingSecret -}}
{{- else -}}
{{- printf "%s" (include "mariia-hub.redis.fullname" .) -}}
{{- end -}}
{{- end -}}

{{/*
Return the PostgreSQL connection string
*/}}
{{- define "mariia-hub.postgresql.connectionString" -}}
{{- $host := include "mariia-hub.postgresql.fullname" . -}}
{{- $port := .Values.postgresql.primary.service.ports.postgresql -}}
{{- $database := .Values.postgresql.auth.database -}}
{{- $username := .Values.postgresql.auth.username -}}
{{- printf "postgresql://%s:%s@%s:%d/%s" $username "PASSWORD" $host $port $database -}}
{{- end -}}

{{/*
Return the Redis connection string
*/}}
{{- define "mariia-hub.redis.connectionString" -}}
{{- $host := include "mariia-hub.redis.fullname" . -}}
{{- $port := .Values.redis.master.service.ports.redis -}}
{{- $database := .Values.redis.database -}}
{{- printf "redis://:%s@%s:%d/%d" "PASSWORD" $host $port $database -}}
{{- end -}}

{{/*
Create the volume name for nginx cache
*/}}
{{- define "mariia-hub.nginxCacheVolumeName" -}}
{{- printf "%s-nginx-cache" (include "mariia-hub.fullname" .) }}
{{- end }}

{{/*
Create the volume name for app logs
*/}}
{{- define "mariia-hub.appLogsVolumeName" -}}
{{- printf "%s-app-logs" (include "mariia-hub.fullname" .) }}
{{- end }}

{{/*
Merge values
*/}}
{{- define "mariia-hub.mergeValues" -}}
{{- $context := index . 0 -}}
{{- $values := index . 1 -}}
{{- $local := index . 2 -}}
{{- $merged := dict -}}
{{- range $key, $value := $values -}}
{{- if hasKey $local $key -}}
{{- $merged = set $merged $key (get $local $key) -}}
{{- else -}}
{{- $merged = set $merged $key $value -}}
{{- end -}}
{{- end -}}
{{- $merged | toYaml -}}
{{- end -}}

{{/*
Return true if the ingress should be configured
*/}}
{{- define "mariia-hub.ingress.enabled" -}}
{{- if and .Values.ingress.enabled (or .Values.ingress.className .Values.ingress.annotations) -}}
{{- true -}}
{{- end -}}
{{- end }}

{{/*
Return true if autoscaling should be configured
*/}}
{{- define "mariia-hub.autoscaling.enabled" -}}
{{- if and .Values.autoscaling.enabled (not (empty .Values.autoscaling.minReplicas)) -}}
{{- true -}}
{{- end -}}
{{- end }}

{{/*
Return true if monitoring should be configured
*/}}
{{- define "mariia-hub.monitoring.enabled" -}}
{{- if and .Values.monitoring.enabled (or .Values.monitoring.serviceMonitor.enabled .Values.monitoring.prometheusRule.enabled) -}}
{{- true -}}
{{- end -}}
{{- end }}

{{/*
Return the proper storage class based on values
*/}}
{{- define "mariia-hub.properStorageClass" -}}
{{- if .Values.persistence.storageClass -}}
{{- .Values.persistence.storageClass -}}
{{- else if .Values.global.storageClass -}}
{{- .Values.global.storageClass -}}
{{- else -}}
{{- "" -}}
{{- end -}}
{{- end }}