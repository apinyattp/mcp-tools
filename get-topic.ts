import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { formatKbEntry } from "./helpers";
import { type ToolDefinition, type ToolContext } from "./index";

const definition: ToolDefinition = {
  name: "get_topic",
  register(server: McpServer, context: ToolContext) {
    // @ts-expect-error MCP SDK + Zod type instantiation depth
    server.tool(
      "get_topic",
      "Retrieve a specific knowledge base entry by its ID.",
      {
        id: z.string().describe("The knowledge base entry UUID"),
      },
      async ({ id }) => {
        try {
          const entry = await context.knowledgeBasesService.findById(id);
          return {
            content: [{ type: "text" as const, text: formatKbEntry(entry) }],
          };
        } catch {
          return {
            content: [
              {
                type: "text" as const,
                text: `Knowledge base entry "${id}" not found.`,
              },
            ],
            isError: true,
          };
        }
      },
    );
  },
};

export default definition;
