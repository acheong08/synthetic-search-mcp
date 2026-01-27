import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const API_ENDPOINT = "https://api.synthetic.new/v2/search";

interface SearchApiResponse {
	results: Array<{
		url: string;
		title: string;
		text: string;
		published?: string;
	}>;
}

const searchParamsSchema = z.object({
	query: z.string().max(400).describe("Search query (max 400 chars)"),
	max_length: z.number().int().min(0).max(10000).optional().default(0).describe("Maximum total characters across all results (0 = no limit)"),
	index: z.number().int().min(0).optional().describe("Return only the result at this index (0-based)"),
});

const searchResultsSchema = z.array(
	z.object({
		url: z.string(),
		title: z.string(),
		text: z.string(),
		published: z.string().optional(),
	}),
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
	},
);

server.registerTool(
	"search",
	{
		title: "Search the web",
		description:
			"Uses a search engine which returns title, url, and content in markdown",
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

		const timeoutMs = parseInt(process.env.SYNTHETIC_TIMEOUT_MS || "30000");
		
		try {
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

			const response = await fetch(API_ENDPOINT, {
				method: "POST",
				headers: {
					Authorization: `Bearer ${apiKey}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ query: params.query }),
				signal: controller.signal,
			});

			clearTimeout(timeoutId);

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

			const data =
				(await response.json()) as SearchApiResponse;
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

			let selectedResults = results;
			
			if (params.index !== undefined) {
				if (params.index >= results.length) {
					return {
						content: [
							{
								type: "text" as const,
								text: `Error: Index ${params.index} is out of range (only ${results.length} results available)`,
							},
						],
						isError: true,
					};
				}
				selectedResults = [results[params.index]];
			}

			const truncate = (text: string, maxLength: number) => {
				if (maxLength <= 0) return text;
				return text.length > maxLength ? text.slice(0, maxLength) + "..." : text;
			};

			let charsPerResult = Infinity;
			if (params.max_length && params.max_length > 0 && selectedResults.length > 0) {
				charsPerResult = Math.floor(params.max_length / selectedResults.length);
			}

			return {
				content: selectedResults.map((result) => ({
					type: "text" as const,
					text: `Title: ${result.title}\nURL: ${result.url}\n${truncate(result.text, charsPerResult)}\n${result.published ? `Published: ${result.published}` : ""}`,
				})),
			};
		} catch (error) {
			let errorMessage = error instanceof Error ? error.message : String(error);
			
			if (error instanceof Error && error.name === "AbortError") {
				errorMessage = `Request timeout after ${timeoutMs}ms`;
			}
			
			return {
				content: [
					{
						type: "text" as const,
						text: `Search failed: ${errorMessage}`,
					},
				],
				isError: true,
			};
		}
	},
);

const transport = new StdioServerTransport();
await server.connect(transport);
