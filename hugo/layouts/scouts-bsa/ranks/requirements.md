{{- /* Markdown twin of requirements.html (scouting-u#126): index.md next to
  each rank's requirements index.html. The body is the shared
  scouts-bsa/ranks/requirements.md partial, the same one llms-full.txt
  uses. Standalone: there is no baseof for the markdown format. */ -}}
{{- $rank := index (index hugo.Data.ranks "scouts-bsa") .Parent.File.ContentBaseName -}}
# {{ .Title }}

Official {{ $rank.program }} requirements for the {{ $rank.title }} rank, from the Scouting America advancement API (version {{ $rank.version_id }}, effective {{ $rank.version_effective_date }}). Overview: [{{ $rank.title }}]({{ partial "llms/page-url.md" .Parent }}).
{{- with .Parent.GetPage "guide" }} Study guide: [{{ $rank.title }} Digital Requirements Guide]({{ partial "llms/page-url.md" . }}).{{ end }}

## Requirements

{{ partial "scouts-bsa/ranks/requirements.md" .Parent }}
