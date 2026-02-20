import * as fs from "fs";
import * as path from "path";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

/**
 * Add your own services/dependencies here.
 * Tools receive this context so they can access shared resources.
 */
export interface ToolContext {
  [key: string]: any;
}

export interface ToolDefinition {
  name: string;
  register(server: McpServer, context: ToolContext): void;
}

function isToolFile(f: string): boolean {
  return (
    (f.endsWith(".ts") || f.endsWith(".js")) &&
    f !== "index.ts" &&
    f !== "index.js" &&
    f !== "helpers.ts" &&
    f !== "helpers.js"
  );
}

async function loadToolsFromDir(dir: string): Promise<ToolDefinition[]> {
  const tools: ToolDefinition[] = [];

  if (!fs.existsSync(dir)) return tools;

  const files = fs.readdirSync(dir).filter(isToolFile);
  for (const file of files) {
    const mod = await import(path.join(dir, file));
    const def: ToolDefinition = mod.default;
    if (def && def.name && typeof def.register === "function") {
      tools.push(def);
    }
  }

  return tools;
}

let allTools: ToolDefinition[] | null = null;

/**
 * Load tools from this directory AND an optional custom tools directory.
 * Custom tools override template tools with the same name.
 */
export async function loadAllTools(
  customToolsDir?: string,
): Promise<ToolDefinition[]> {
  if (allTools) return allTools;

  const baseDir = path.dirname(__filename);
  const baseTools = await loadToolsFromDir(baseDir);

  if (customToolsDir) {
    const customTools = await loadToolsFromDir(customToolsDir);
    // Custom tools override template tools with same name
    const toolMap = new Map<string, ToolDefinition>();
    for (const t of baseTools) toolMap.set(t.name, t);
    for (const t of customTools) toolMap.set(t.name, t);
    allTools = Array.from(toolMap.values());
  } else {
    allTools = baseTools;
  }

  return allTools;
}

export async function registerTools(
  server: McpServer,
  allowedTools: string[],
  context: ToolContext,
  customToolsDir?: string,
): Promise<void> {
  const tools = await loadAllTools(customToolsDir);
  for (const tool of tools) {
    if (allowedTools.includes(tool.name)) {
      tool.register(server, context);
    }
  }
}
