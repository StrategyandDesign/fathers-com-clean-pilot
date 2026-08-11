# Content Pipeline
### The one job left: films and their questions. This is the rail.
AUDIT-V41 WP-J deliverable.

## The format
One JSON per course in `content/`, versioned in git. See
`content/coming-home-present.example.json` for the shape. Rules the importer
enforces: every video carries a real `duration_seconds` greater than zero (no
film, no row); at least three checkpoint questions per video, five
recommended, because eighty percent of two is perfection; `correct_index` in
range; two to five choices; unique `ord`; a non-empty final; and no banned
claim strings inside prompts, because course content obeys the same law as
pages.

## The import
```
SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
  python3 tools/import_content.py content/<course>.json [--create]
```
The service key comes from the project dashboard, lives only in your shell
env, and never enters git or any client bundle. The importer upserts, so
re-running after edits is safe.

## Vimeo hygiene, per film
Set each film to unlisted with domain-level privacy restricted to the
deployment domains. Read `duration_seconds` from the Vimeo video settings and
carry it into the JSON exactly. The player already pins the experience: no
download, no picture-in-picture, no speed control (`pip=0&speed=0&dnt=1` in
the embed).

## The publication rule
A course publishes only when every one of its video rows has a live film.
No film-in-production rows inside a published course; the written sessions
pages carry the interim story instead. This is also what makes the server's
no-film rejection unreachable in production.
