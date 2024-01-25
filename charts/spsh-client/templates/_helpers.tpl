{{/* vim: set filetype=mustache: */}}
{{/*
Expand the name of the chart.
*/}}
{{- define "spsh-client.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Create specific names based on resource kind
*/}}
{{- define "spsh-client.deploymentName" -}}
{{- printf "%s-deployment" (include "spsh-client.name" .) | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "spsh-client.serviceName" -}}
{{- printf "%s-service" (include "spsh-client.name" .) | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "spsh-client.ingressName" -}}
{{- printf "%s-ingress" (include "spsh-client.name" .) | trunc 63 | trimSuffix "-" -}}
{{- end -}}
