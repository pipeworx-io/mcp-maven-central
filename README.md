# @pipeworx/maven-central

Maven Central MCP — Java/JVM artifact search (~12M artifacts). No auth.

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1394+ live data sources.

## Tools

- `search(query, rows?, start?)` — full-text across groupId/artifactId/version
- `search_by_coords(group_id?, artifact_id?, version?, rows?, start?)` — structured lookup
- `list_versions(group_id, artifact_id, rows?)`
- `latest_version(group_id, artifact_id)`

## Data source

`https://search.maven.org/solrsearch/select` — Solr-backed JSON API.

## Quick Start

Add to your MCP client (Claude Desktop, Cursor, Windsurf, etc.):

```json
{
  "mcpServers": {
    "maven-central": {
      "url": "https://gateway.pipeworx.io/maven-central/mcp"
    }
  }
}
```

Or connect to the full Pipeworx gateway for access to all 1394+ data sources:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English:

```
ask_pipeworx({ question: "your question about Maven Central data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
