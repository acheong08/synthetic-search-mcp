# Synthetic Search MCP

Model Context Protocol server for Synthetic Search API. For my personal use.

## OpenCode config

```json
{
  "mcp": {
    "synthetic-web-search": {
      "type": "local",
      "command": ["bunx", "-y", "synthetic-search-mcp"],
      "environment": {
        "SYNTHETIC_API_KEY": "<placeholder>"
      },
      "enabled": true
    }
  }
}
```

## Tools

### search

Search the web using Synthetic Search API.

**Parameters:**
- `query` (string): Search query (max 400 chars)

**Returns:** Search results with title, URL, description, and optional publication date.
