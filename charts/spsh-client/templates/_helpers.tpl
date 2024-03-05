{{/* vim: set filetype=mustache: */}}
{{/*
Expand the name of the chart.
*/}}
{{- define "schulportal-client.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Create specific names based on resource kind
*/}}
{{- define "schulportal-client.deploymentName" -}}
{{- printf "%s-deployment" (include "schulportal-client.name" .) | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "schulportal-client.serviceName" -}}
{{- printf "%s-service" (include "schulportal-client.name" .) | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "schulportal-client.ingressName" -}}
{{- printf "%s-ingress" (include "schulportal-client.name" .) | trunc 63 | trimSuffix "-" -}}
{{- end -}}
