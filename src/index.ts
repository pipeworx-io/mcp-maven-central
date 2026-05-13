interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface McpToolExport {
  tools: McpToolDefinition[];
  callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  meter?: { credits: number };
  cost?: Record<string, unknown>;
  provider?: string;
}

/**
 * Maven Central MCP — Java/JVM artifact registry
 *
 * Backed by a public Solr instance.
 * API docs: https://central.sonatype.org/search/rest-api-guide/
 * Auth: none.
 */


const BASE = 'https://search.maven.org/solrsearch/select';

const tools: McpToolExport['tools'] = [
  {
    name: 'search',
    description: 'Full-text search across groupId, artifactId, version, tags.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Free-text query' },
        rows: { type: 'number', description: 'Max rows, 1-200 (default 20)' },
        start: { type: 'number', description: '0-based offset' },
      },
      required: ['query'],
    },
  },
  {
    name: 'search_by_coords',
    description: 'Structured lookup by Maven coordinates. Provide any combination of groupId / artifactId / version.',
    inputSchema: {
      type: 'object',
      properties: {
        group_id: { type: 'string', description: 'groupId — e.g. "org.springframework"' },
        artifact_id: { type: 'string', description: 'artifactId — e.g. "spring-core"' },
        version: { type: 'string', description: 'version' },
        rows: { type: 'number', description: '1-200 (default 20)' },
        start: { type: 'number', description: '0-based offset' },
      },
    },
  },
  {
    name: 'list_versions',
    description: 'All published versions for a given (groupId, artifactId).',
    inputSchema: {
      type: 'object',
      properties: {
        group_id: { type: 'string' },
        artifact_id: { type: 'string' },
        rows: { type: 'number', description: '1-200 (default 200)' },
      },
      required: ['group_id', 'artifact_id'],
    },
  },
  {
    name: 'latest_version',
    description: 'Most recent release version of (groupId, artifactId).',
    inputSchema: {
      type: 'object',
      properties: {
        group_id: { type: 'string' },
        artifact_id: { type: 'string' },
      },
      required: ['group_id', 'artifact_id'],
    },
  },
];

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    case 'search':
      return solrQuery(String(args.query), (args.rows as number) ?? 20, (args.start as number) ?? 0);
    case 'search_by_coords': {
      const parts: string[] = [];
      if (args.group_id) parts.push(`g:${quote(String(args.group_id))}`);
      if (args.artifact_id) parts.push(`a:${quote(String(args.artifact_id))}`);
      if (args.version) parts.push(`v:${quote(String(args.version))}`);
      if (!parts.length) throw new Error('Provide at least one of group_id / artifact_id / version.');
      return solrQuery(parts.join(' AND '), (args.rows as number) ?? 20, (args.start as number) ?? 0);
    }
    case 'list_versions': {
      const g = reqStr(args, 'group_id', '"org.springframework"');
      const a = reqStr(args, 'artifact_id', '"spring-core"');
      const params = new URLSearchParams({
        q: `g:${quote(g)} AND a:${quote(a)}`,
        core: 'gav',
        rows: String(Math.min(200, Math.max(1, (args.rows as number) ?? 200))),
        wt: 'json',
      });
      const res = await mavenFetch(params);
      const docs = (res as MavenResponse).response?.docs ?? [];
      return {
        group_id: g,
        artifact_id: a,
        count: docs.length,
        versions: docs.map((d) => ({ version: d.v, released: d.timestamp ? new Date(d.timestamp).toISOString() : null })),
      };
    }
    case 'latest_version': {
      const g = reqStr(args, 'group_id', '"org.springframework"');
      const a = reqStr(args, 'artifact_id', '"spring-core"');
      const params = new URLSearchParams({
        q: `g:${quote(g)} AND a:${quote(a)}`,
        rows: '1',
        wt: 'json',
      });
      const res = await mavenFetch(params);
      const doc = (res as MavenResponse).response?.docs?.[0];
      if (!doc) throw new Error(`Maven Central: no artifact ${g}:${a}`);
      return { group_id: g, artifact_id: a, latest_version: doc.latestVersion ?? doc.v };
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

async function solrQuery(q: string, rows: number, start: number) {
  const params = new URLSearchParams({
    q,
    rows: String(Math.min(200, Math.max(1, rows))),
    start: String(Math.max(0, start)),
    wt: 'json',
  });
  return mavenFetch(params);
}

interface MavenResponse {
  response?: { numFound?: number; docs?: { g?: string; a?: string; v?: string; latestVersion?: string; timestamp?: number; tags?: string[] }[] };
}

async function mavenFetch(params: URLSearchParams) {
  const res = await fetch(`${BASE}?${params}`, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'pipeworx-mcp-maven-central/1.0 (+https://pipeworx.io)',
    },
  });
  if (res.status === 429) throw new Error('Maven Central: rate-limit (HTTP 429)');
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Maven Central error: ${res.status} ${t.slice(0, 200)}`);
  }
  return res.json();
}

function quote(s: string): string {
  return /^[a-zA-Z0-9._-]+$/.test(s) ? s : `"${s.replace(/"/g, '\\"')}"`;
}

function reqStr(args: Record<string, unknown>, key: string, example: string): string {
  const v = args[key];
  if (typeof v !== 'string' || !v.trim()) {
    throw new Error(`Required argument "${key}" is missing. Pass a string like ${example}.`);
  }
  return v;
}

export default { tools, callTool, meter: { credits: 1 } } satisfies McpToolExport;
