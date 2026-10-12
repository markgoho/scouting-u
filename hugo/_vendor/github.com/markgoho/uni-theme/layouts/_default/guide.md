{{- /* guide.md (uni-theme#41): the Markdown twin of guide.html, for a
  guide page that turns on the `markdown` output format.

  Writes the group label and title, the description, the body through
  .RenderShortcodes (raw Markdown with each shortcode rendered by its .md
  variant -- .Content would be goldmark HTML), and prev/next links as
  absolute URLs. A shortcode with no .md variant falls back to its .html
  output, so every shortcode a guide uses needs one. HTML comments in
  the body are removed.
*/ -}}
{{- $navData := partial "drg/resolve-nav.html" . -}}
{{- $cleanTitle := replaceRE `^(Req|Requirement) [0-9A-Za-z]+([–-][0-9A-Za-z]+)? — ` "" .Title -}}
# {{ $cleanTitle }}
{{ with $navData.group_title_display }}
{{ . }}
{{ end }}
{{- with .Description }}
{{ . }}
{{ end }}
{{ strings.TrimSpace (replaceRE `(?s)<!--.*?-->` "" .RenderShortcodes) }}
{{ if or $navData.prev $navData.next }}
---
{{ with $navData.prev }}
Previous: [{{ $navData.prev_title | default "Previous Page" }}]({{ . | absURL }})
{{- end }}
{{- with $navData.next }}
Next: [{{ $navData.next_title | default "Next Page" }}]({{ . | absURL }})
{{- end }}
{{ end -}}
