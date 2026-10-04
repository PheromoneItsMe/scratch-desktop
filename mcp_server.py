"""
Scratch AI Studio - Live Bridge MCP Server
Provides real-time inspection, generation, and injection tools for the running Scratch AI Studio desktop instance.
Author: Pheromone
"""

import json
import urllib.request
import urllib.error
from typing import Dict, Any, Optional
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("Scratch AI Studio Live")

BRIDGE_URL = "http://127.0.0.1:8765"

def _request(path: str, method: str = "GET", data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    url = f"{BRIDGE_URL}{path}"
    headers = {"Content-Type": "application/json"}
    body = json.dumps(data).encode("utf-8") if data else None
    
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=8) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.URLError as e:
        return {"error": f"Failed to connect to Scratch AI Studio on {BRIDGE_URL}. Is the desktop app running? Details: {e}"}
    except Exception as e:
        return {"error": str(e)}

@mcp.tool()
def studio_status() -> Dict[str, Any]:
    """Check whether the Scratch AI Studio desktop window is open and the live bridge is responding."""
    return _request("/health")

@mcp.tool()
def studio_get_scene_state() -> Dict[str, Any]:
    """Get real-time scene state (sprite coordinates, costumes, visibility) from the running desktop window."""
    return _request("/api/state")

@mcp.tool()
def studio_get_project() -> Dict[str, Any]:
    """Retrieve the full current project JSON structure directly from the running Scratch VM memory."""
    return _request("/api/project")

@mcp.tool()
def studio_load_project(project_json: str) -> Dict[str, Any]:
    """Hot-reload a project directly into the open Scratch AI Studio window in real time."""
    try:
        parsed = json.loads(project_json) if isinstance(project_json, str) else project_json
    except Exception as e:
        return {"error": f"Invalid project JSON: {e}"}
    return _request("/api/load-project", method="POST", data={"project": parsed})

@mcp.tool()
def studio_add_sprite(sprite_json: str) -> Dict[str, Any]:
    """Dynamically inject a new sprite into the running game without restarting or reloading the project."""
    try:
        parsed = json.loads(sprite_json) if isinstance(sprite_json, str) else sprite_json
    except Exception as e:
        return {"error": f"Invalid sprite JSON: {e}"}
    return _request("/api/add-sprite", method="POST", data={"sprite": parsed})

if __name__ == "__main__":
    mcp.run()
