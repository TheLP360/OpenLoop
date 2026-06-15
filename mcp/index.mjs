#!/usr/bin/env node
// OpenLoop MCP server.
//
// Exposes your private OpenLoop workspace to an MCP-capable assistant (Claude
// Desktop, Claude Code, etc.) by wrapping the app's AI HTTP API. It needs no
// database access of its own — just the deployed URL and your AI key.
//
// Env:
//   OPENLOOP_BASE_URL   e.g. https://openloop.vercel.app
//   OPENLOOP_API_KEY    the same value as the app's AI_SEARCH_API_KEY
//
// Register in Claude Desktop (claude_desktop_config.json):
//   "openloop": {
//     "command": "node",
//     "args": ["/abs/path/to/OpenLoop/mcp/index.mjs"],
//     "env": { "OPENLOOP_BASE_URL": "https://…", "OPENLOOP_API_KEY": "…" }
//   }

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const BASE_URL = (process.env.OPENLOOP_BASE_URL || "").replace(/\/$/, "");
const API_KEY = process.env.OPENLOOP_API_KEY || "";

if (!BASE_URL || !API_KEY) {
  console.error("OpenLoop MCP: set OPENLOOP_BASE_URL and OPENLOOP_API_KEY.");
  process.exit(1);
}

async function api(path, init = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      "x-openloop-key": API_KEY,
      "content-type": "application/json",
      ...(init.headers || {}),
    },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`OpenLoop API ${res.status}: ${text}`);
  return text ? JSON.parse(text) : {};
}

const KIND_ENUM = ["next_step", "outcome", "thought", "resource"];

const TOOLS = [
  {
    name: "openloop_search",
    description:
      "Search the OpenLoop workspace (Next Steps, Outcomes, Thoughts, Resources) with ranked fuzzy matching.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search text." },
        kind: { type: "string", enum: KIND_ENUM, description: "Optional: restrict to one type." },
        limit: { type: "number", description: "Max results (1-100).", default: 25 },
      },
      required: ["query"],
    },
  },
  {
    name: "openloop_list",
    description: "List items, optionally filtered by kind and/or status, newest first.",
    inputSchema: {
      type: "object",
      properties: {
        kind: { type: "string", enum: KIND_ENUM },
        status: {
          type: "string",
          enum: ["intake", "next", "active", "waiting", "someday", "done", "archived"],
        },
        limit: { type: "number", default: 50 },
      },
    },
  },
  {
    name: "openloop_capture",
    description: "Capture a new item into the OpenLoop Intake for later processing.",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string" },
        description: { type: "string" },
        body: { type: "string", description: "Long-form content (e.g. for a Thought)." },
        kind: { type: "string", enum: KIND_ENUM, description: "Optional; leave unset to triage later." },
      },
      required: ["title"],
    },
  },
];

const server = new Server(
  { name: "openloop", version: "0.1.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args = {} } = request.params;
  try {
    let result;
    if (name === "openloop_search") {
      result = await api("/api/ai/search", { method: "POST", body: JSON.stringify(args) });
    } else if (name === "openloop_list") {
      const qs = new URLSearchParams();
      if (args.kind) qs.set("kind", args.kind);
      if (args.status) qs.set("status", args.status);
      if (args.limit) qs.set("limit", String(args.limit));
      result = await api(`/api/ai/items?${qs.toString()}`);
    } else if (name === "openloop_capture") {
      result = await api("/api/ai/items", { method: "POST", body: JSON.stringify(args) });
    } else {
      throw new Error(`Unknown tool: ${name}`);
    }
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  } catch (err) {
    return {
      isError: true,
      content: [{ type: "text", text: err instanceof Error ? err.message : String(err) }],
    };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
console.error("OpenLoop MCP server running on stdio.");
