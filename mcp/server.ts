#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import dotenv from "dotenv";

dotenv.config();

const API_BASE_URL =
  process.env.ENEMITES_API_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  "https://enemites.com/api/forms";

const API_KEY =
  process.env.ENEMITES_API_KEY ||
  "enemites_sec_8f94d1b7a2e84c90bc5e8a719d3f562e8490a1bc7e39d481";

const server = new Server(
  {
    name: "enemites-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define tool schemas
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "enemites_create_form",
        description:
          "Create a new dynamic questionnaire/survey form on enemites. Supports multiple question types (text, textarea, radio, checkbox, rating 1-5 or 1-10, dropdown select). Allows setting validity period (expires_at) or making it endless/never expiring.",
        inputSchema: {
          type: "object",
          properties: {
            title: {
              type: "string",
              description: "The title of the form/questionnaire (e.g., 'Customer Onboarding Survey')",
            },
            description: {
              type: "string",
              description: "Optional introductory text or instructions for respondents",
            },
            slug: {
              type: "string",
              description: "Unique URL slug (e.g. 'onboarding-q1'). The public form will be at /form/:slug",
            },
            expires_at: {
              type: "string",
              description:
                "Optional ISO 8601 timestamp string for when this form expires (e.g. '2026-12-31T23:59:59Z'). Leave empty/null for endless (never expires).",
            },
            questions: {
              type: "array",
              description: "Array of question objects to be presented in the questionnaire",
              items: {
                type: "object",
                properties: {
                  id: {
                    type: "string",
                    description: "Unique identifier for this question (e.g. 'nps_score', 'user_feedback')",
                  },
                  label: {
                    type: "string",
                    description: "The question text shown to the user",
                  },
                  type: {
                    type: "string",
                    enum: [
                      "text",
                      "textarea",
                      "radio",
                      "checkbox",
                      "rating",
                      "select",
                      "email",
                      "number",
                      "phone",
                    ],
                    description: "Type of input field",
                  },
                  placeholder: {
                    type: "string",
                    description: "Optional placeholder text inside input box",
                  },
                  required: {
                    type: "boolean",
                    description: "Whether this question is mandatory (default: false)",
                  },
                  options: {
                    type: "array",
                    items: { type: "string" },
                    description: "Options array for radio, checkbox, or select types",
                  },
                  min: {
                    type: "number",
                    description: "Min value for rating scale (default: 1)",
                  },
                  max: {
                    type: "number",
                    description: "Max value for rating scale (e.g. 5 for stars, 10 for 1-10 NPS scale)",
                  },
                  helperText: {
                    type: "string",
                    description: "Optional guidance or helper note for the question",
                  },
                },
                required: ["id", "label", "type"],
              },
            },
          },
          required: ["title", "slug", "questions"],
        },
      },
      {
        name: "enemites_list_forms",
        description:
          "List all existing questionnaire forms created under enemites, including their slug, status, validity/expiration period, and total submission counts.",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "enemites_get_form",
        description: "Retrieve details and questions structure of a specific form by its slug.",
        inputSchema: {
          type: "object",
          properties: {
            slug: {
              type: "string",
              description: "The unique slug of the form to fetch",
            },
          },
          required: ["slug"],
        },
      },
      {
        name: "enemites_delete_form",
        description: "Delete an existing form and its submitted responses permanently by its slug.",
        inputSchema: {
          type: "object",
          properties: {
            slug: {
              type: "string",
              description: "The slug of the form to delete",
            },
          },
          required: ["slug"],
        },
      },
      {
        name: "enemites_get_submissions",
        description:
          "Retrieve all submitted responses for a questionnaire form by slug, allowing the AI to summarize, analyze sentiment, or generate reports.",
        inputSchema: {
          type: "object",
          properties: {
            slug: {
              type: "string",
              description: "The slug of the form whose responses should be fetched",
            },
          },
          required: ["slug"],
        },
      },
    ],
  };
});

// Handle tool executions
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const baseUrl = API_BASE_URL.replace(/\/+$/, "");

  try {
    // 1. Create Form
    if (name === "enemites_create_form") {
      const response = await fetch(baseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_KEY}`,
        },
        body: JSON.stringify(args),
      });
      const data = await response.json();
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    }

    // 2. List Forms
    if (name === "enemites_list_forms") {
      const response = await fetch(baseUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${API_KEY}`,
        },
      });
      const data = await response.json();
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    }

    // 3. Get Form
    if (name === "enemites_get_form") {
      const slug = (args as any)?.slug;
      const response = await fetch(`${baseUrl}/${encodeURIComponent(slug)}`, {
        method: "GET",
      });
      const data = await response.json();
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    }

    // 4. Delete Form
    if (name === "enemites_delete_form") {
      const slug = (args as any)?.slug;
      const response = await fetch(`${baseUrl}/${encodeURIComponent(slug)}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${API_KEY}`,
        },
      });
      const data = await response.json();
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    }

    // 5. Get Submissions
    if (name === "enemites_get_submissions") {
      const slug = (args as any)?.slug;
      const response = await fetch(`${baseUrl}/${encodeURIComponent(slug)}/submissions`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${API_KEY}`,
        },
      });
      const data = await response.json();
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    }

    throw new Error(`Unknown tool: ${name}`);
  } catch (error: any) {
    return {
      isError: true,
      content: [
        {
          type: "text",
          text: `Error executing ${name}: ${error.message || error}`,
        },
      ],
    };
  }
});

async function run() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("enemites MCP server running on stdio");
}

run().catch((error) => {
  console.error("Fatal error in enemites MCP server:", error);
  process.exit(1);
});
