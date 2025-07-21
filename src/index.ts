import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StreamableHTTPTransport } from '@hono/mcp'
import { Hono } from 'hono'
import {string} from "zod"
import type { CallToolResult} from '@modelcontextprotocol/sdk/types.js'

const app = new Hono()

// Your MCP server implementation
const mcpServer = new McpServer({
  name: 'my-mcp-server',
  version: '1.0.0',
},{
  
})

let XAPI_URL: string | undefined

string().describe("Enter the keyword you want to search for.").parse("query")

mcpServer.tool(
  "search",
  "Search Tool",
  {
    // query: { type: "string", description: "Enter the keyword you want to search for." }
    query: string().describe("Enter the keyword you want to search for.")
  },
  async (input):Promise<CallToolResult> => {
    const query = input?.query
    if (typeof XAPI_URL !== "string") {
      throw new Error("The X-API-URL header is not specified.")
    }
    if (!query) {
      throw new Error("A search query is required.")
    }
    const url = new URL("/search", XAPI_URL)
    url.searchParams.set("q", query)
    url.searchParams.set("format", "json")
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Search failed: ${response.statusText}`)
    }

    return {
      content: [
        {
          type: "text",
          text: await response.text()
        }
      ]
    }
  }
)

app.get('/', (c) => {
  return c.html(`
    <h1>Welcome to the MCP Search Server</h1>
    <p>Use the /mcp endpoint to interact with the MCP server.</p>
    <p>Make sure to set the X-API-URL header to the API endpoint you want to search against.</p>
    `)
})

app.all('/mcp', async (c) => {
  XAPI_URL = c.req.header('X-API-URL')
  const transport = new StreamableHTTPTransport()
  await mcpServer.connect(transport)
  return transport.handleRequest(c)
})

export default app