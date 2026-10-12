{{- /* llms.txt sections hook (scouting-u#125), overriding uni-theme's
  default. Context: the home Page. Every link goes through
  llms/page-url.md, so it points at the page's markdown twin once the
  page has one and needs no edit when more twins ship. */ -}}
{{- $ranks := (site.GetPage "/scouts-bsa/ranks").Sections.ByParam "level" -}}
## Ranks

{{ range $ranks -}}
- [{{ .Title }}]({{ partial "llms/page-url.md" . }}): {{ .Params.description }}
{{ end }}
## Guides

{{ range $ranks -}}
{{ with .GetPage "guide" -}}
- [{{ .Params.rank_name }} Digital Requirements Guide]({{ partial "llms/page-url.md" . }}): Study guide for each {{ .Params.rank_name }} rank requirement.
{{ end -}}
{{ end -}}
{{ range slice "/scouts-bsa/field-guides" "/scouts-bsa/leadership" -}}
{{ with site.GetPage . -}}
- [{{ .Title }}]({{ partial "llms/page-url.md" . }}): {{ .Description }}
{{ range .RegularPages -}}
- [{{ .Title }}]({{ partial "llms/page-url.md" . }}): {{ .Description }}
{{ end -}}
{{ end -}}
{{ end }}
## Optional

{{ with site.GetPage "/search" -}}
- [{{ .Title }}]({{ partial "llms/page-url.md" . }}): Full-text search across every rank requirement and guide.
{{ end -}}
