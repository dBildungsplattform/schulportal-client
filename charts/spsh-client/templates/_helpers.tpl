{{/* vim: set filetype=mustache: */}}
{{/*
Expand the name of the chart.
*/}}
{{- define "spsh-client.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Create a default fully qualified app name.
*/}}
{{- define "spsh-client.fullname" -}}
{{- if .Values.fullnameOverride -}}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- $name := default .Chart.Name .Values.nameOverride -}}
{{- printf "%s" $name | trunc 63 | trimSuffix "-" -}}
{{- end -}}
{{- end -}}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "spsh-client.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Create specific names based on resource kind, excluding the release name.
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
