# mcp-maven-central

Maven Central MCP — Java/JVM artifact registry

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 250+ live data sources.

## Tools

| Tool | Description |
|------|-------------|
| `search` | Full-text search across groupId, artifactId, version, tags. |
| `search_by_coords` | Structured lookup by Maven coordinates. Provide any combination of groupId / artifactId / version. |
| `list_versions` | All published versions for a given (groupId, artifactId). |
| `latest_version` | Most recent release version of (groupId, artifactId). |

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

Or connect to the full Pipeworx gateway for access to all 250+ data sources:

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

- [All tools and guides](https://github.com/pipeworx-io/examples)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
