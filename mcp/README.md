# Enemites MCP Server for AI Agents

Enemites Model Context Protocol (MCP) Server enables AI Agents to create, manage, list, delete, and analyze dynamic questionnaires & customer survey forms.

---

## 🔑 Agent Credential

The forms API reads `ENEMITES_API_KEY` from Vercel environment variables. Configure the matching key in your Agent or MCP runtime using a private environment file or secret manager; Vercel variables are not automatically available to external MCP clients.

- **Required private variable:** `ENEMITES_API_KEY`
- **Production API Base URL:** `https://enemites.com/api/forms`

---

## 🛠️ Tools Available for Agents

| Tool Name | Description |
| :--- | :--- |
| `enemites_create_form` | Creates a new questionnaire. Supports multiple question types (text, textarea, radio, checkbox, rating 1-5/1-10, dropdown) and customizable expiration period (or endless / null). |
| `enemites_list_forms` | Lists all created forms, active status, expiration date, and submission counts. |
| `enemites_get_form` | Gets the structure and schema of a specific form by its slug. |
| `enemites_delete_form` | Permanently deletes a form and its associated submissions. |
| `enemites_get_submissions` | Fetches all user responses for a form so the AI can analyze sentiment and generate reports. |

---

## ⚙️ Configuration Setup

### Antigravity / Claude Desktop Configuration

Add the following to your `claude_desktop_config.json` or Antigravity MCP settings:

```json
{
  "mcpServers": {
    "enemites": {
      "command": "npx",
      "args": ["-y", "tsx", "c:/Users/user/Waitlist-landing-page/mcp/server.ts"],
      "env": {
        "ENEMITES_API_URL": "https://enemites.com/api/forms",
        "ENEMITES_API_KEY": "<set privately; never commit the actual value>"
      }
    }
  }
}
```

---

## 🌐 Public Form URL

Forms created by the agent are immediately accessible at:
```
https://enemites.com/form/:slug
```
(e.g., `https://enemites.com/form/customer-feedback`)
