# Knowledge Base Sources

Drop files here — the system auto-indexes everything on next `python scripts/build_index.py`.

## Folders

### runbooks/
Markdown files (`.md`) with service-specific troubleshooting guides.
Format: free-form markdown. Each H2/H3 section becomes a separate chunk.

### error_logs/
Raw log files (`.log`, `.txt`) with past error lines.
Format: one log line per line. Each line becomes a separate chunk.

## Adding new sources
1. Drop your file into the right folder
2. Run `python scripts/build_index.py` — or use the UI Upload button
3. The new content is immediately searchable
