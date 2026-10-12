{{/* scouts-bsa/ranks/requirements.md

  Markdown body for one rank's requirements: header, requirement list,
  footer, footnotes. The text twin of requirements.html's main column,
  for the requirements index.md (scouting-u#126) and llms-full.txt
  (scouting-u#129), so the two cannot drift from each other or from the
  HTML page.

  Nodes come from requirement-node.html, the same mapper the HTML page
  feeds req-card.html; uni-theme's text/requirements.md renders them.
  Header and footer are synced HTML, so they go through
  text/markdown-text.md too. Footnote markers are unique across ranks
  (1-13 in the synced data), so several ranks in one file do not collide.

  Params: the rank's landing section Page.
  Returns: a Markdown string with no headings, no HTML tags.
*/}}
{{ $rank := index (index hugo.Data.ranks "scouts-bsa") .File.ContentBaseName }}
{{ $guide := .GetPage "guide" }}

{{ $nodes := slice }}
{{ range $rank.requirements }}
  {{ $nodes = $nodes | append (partial "scouts-bsa/ranks/requirement-node.html" (dict "req" . "depth" 1 "rank_title" $rank.title "guide" $guide)) }}
{{ end }}

{{ $footnotes := slice }}
{{ range $rank.footnotes }}
  {{ $footnotes = $footnotes | append (dict "marker" .marker "text" .text "text_format" "html") }}
{{ end }}

{{ $parts := slice }}
{{ with $rank.header }}
  {{ $parts = $parts | append (partial "text/markdown-text.md" (dict "text" . "text_format" "html")) }}
{{ end }}
{{ $parts = $parts | append (partial "text/requirements.md" (dict "nodes" $nodes)) }}
{{ with $rank.footer }}
  {{ $parts = $parts | append (partial "text/markdown-text.md" (dict "text" . "text_format" "html")) }}
{{ end }}
{{ with $footnotes }}
  {{ $parts = $parts | append (partial "text/requirements.md" (dict "nodes" slice "footnotes" .)) }}
{{ end }}

{{ $out := slice }}
{{ range $parts }}
  {{ with trim . "\n " }}{{ $out = $out | append . }}{{ end }}
{{ end }}
{{ return delimit $out "\n\n" }}
