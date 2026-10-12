{{- /* Markdown twin of rank-landing.html (scouting-u#126): index.md next to
  each rank landing index.html. Standalone: there is no baseof for the
  markdown format. */ -}}
{{- $rank := index (index hugo.Data.ranks "scouts-bsa") .File.ContentBaseName -}}
{{- $siblings := .Parent.Pages.ByParam "level" -}}
# {{ .Title }}

{{ .Params.description }}

- Rank {{ $rank.level }} of {{ len $siblings }} in {{ $rank.program }}.
- {{ len $rank.requirements }} requirements, version {{ $rank.version_id }}, effective {{ $rank.version_effective_date }}.
{{- with .GetPage "requirements" }}
- Requirements: [{{ .Title }}]({{ partial "llms/page-url.md" . }})
{{- end }}
{{- with .GetPage "guide" }}
- Study guide: [{{ $rank.title }} Digital Requirements Guide]({{ partial "llms/page-url.md" . }})
{{- end }}
{{- range $i, $p := $siblings }}
  {{- if eq $p $ }}
    {{- if gt $i 0 }}{{ with index $siblings (sub $i 1) }}
- Previous rank: [{{ .Title }}]({{ partial "llms/page-url.md" . }})
    {{- end }}{{ end }}
    {{- if lt $i (sub (len $siblings) 1) }}{{ with index $siblings (add $i 1) }}
- Next rank: [{{ .Title }}]({{ partial "llms/page-url.md" . }})
    {{- end }}{{ end }}
  {{- end }}
{{- end }}
