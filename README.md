# Synthetic Search MCP

Model Context Protocol server for Synthetic Search API.

## Installation

```bash
bunx -y @synthetic/search-mcp
```

Or install globally:

```bash
bun install -g @synthetic/search-mcp
```

## Configuration

Set the `SYNTHETIC_API_KEY` environment variable:

```bash
export SYNTHETIC_API_KEY="your_api_key_here"
```

## Usage with Claude Desktop

Add to your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "synthetic-search": {
      "command": "bunx",
      "args": ["-y", "@synthetic/search-mcp"],
      "env": {
        "SYNTHETIC_API_KEY": "your_api_key_here"
      }
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
