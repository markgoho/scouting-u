{{- /* llms-full.txt body hook (scouting-u#129), overriding uni-theme's
  default. Context: the home Page. One section per rank, Scout to Eagle,
  with the same scouts-bsa/ranks/requirements.md body as each
  requirements index.md, so the two cannot drift. */ -}}
{{- range (site.GetPage "/scouts-bsa/ranks").Sections.ByParam "level" }}
## {{ .Title }}

{{ .Params.description }}

{{ partial "scouts-bsa/ranks/requirements.md" . }}
{{ with .GetPage "requirements" }}
- Requirements page: [{{ .Title }}]({{ partial "llms/page-url.md" . }})
{{- end }}
{{- with .GetPage "guide" }}
- Study guide: [{{ .Params.rank_name }} Digital Requirements Guide]({{ partial "llms/page-url.md" . }})
{{- end }}
{{ end -}}
