import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const API_ENDPOINT = "https://api.synthetic.new/v2/search";

const searchParamsSchema = z.object({
  query: z.string().max(400).describe("Search query (max 400 chars)"),
});

const searchResultsSchema = z.array(
  z.object({
    url: z.string(),
    title: z.string(),
    text: z.string(),
    published: z.string().optional(),
  })
);

const server = new McpServer(
  {
    version: "1.0.0",
    name: "synthetic-search",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.registerTool(
  "search",
  {
    title: "Search the web",
    description: "Search using Synthetic Search API",
    inputSchema: searchParamsSchema,
  },
  async (params) => {
    const apiKey = process.env.SYNTHETIC_API_KEY;
    if (!apiKey) {
      return {
        content: [
          {
            type: "text" as const,
            text: "Error: SYNTHETIC_API_KEY environment variable not set",
          },
        ],
        isError: true,
      };
    }

    try {
      const response = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: params.query }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          content: [
            {
              type: "text" as const,
              text: `API error: ${response.status} ${errorText}`,
            },
          ],
          isError: true,
        };
      }

      const data = await response.json();
      const results = searchResultsSchema.parse(data.results);

      if (results.length === 0) {
        return {
          content: [
            {
              type: "text" as const,
              text: "No results found",
            },
          ],
        };
      }

      return {
        content: results.map((result) => ({
          type: "text" as const,
          text: `Title: ${result.title}\nURL: ${result.url}\n${result.text}\n${result.published ? `Published: ${result.published}` : ""}`,
        })),
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Search failed: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);