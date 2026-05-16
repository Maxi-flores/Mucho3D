from __future__ import annotations

import time
import sys
from pathlib import Path
from typing import Any

from fastapi import FastAPI
from pydantic import BaseModel, Field

sys.path.insert(0, str(Path(__file__).resolve().parent))
from run_tool import execute_tool


app = FastAPI(title="Mucho3D Blender Worker", version="1.0.0")


class ExecuteRequest(BaseModel):
    tool: str = Field(min_length=1)
    payload: dict[str, Any] = Field(default_factory=dict)


@app.get("/health")
def health() -> dict[str, Any]:
    return {
        "ok": True,
        "service": "mucho3d-blender-worker",
        "status": "healthy",
    }


@app.post("/execute")
def execute(request: ExecuteRequest) -> dict[str, Any]:
    started_at = time.perf_counter()

    try:
        # Execute the tool
        result = execute_tool(request.tool, request.payload)

        # Capture snapshot after successful execution
        snapshot = None
        snapshot_enabled = request.payload.get("captureSnapshot", True)

        if snapshot_enabled and request.tool in ["create_primitive", "transform_object", "apply_material"]:
            from run_tool import capture_viewport_snapshot
            snapshot = capture_viewport_snapshot()
            result["snapshot"] = snapshot

        duration_ms = round((time.perf_counter() - started_at) * 1000, 3)
        return {
            "success": True,
            "result": result,
            "logs": [f"Blender executed {request.tool} in {duration_ms}ms"],
            "error": None,
        }
    except Exception as error:
        duration_ms = round((time.perf_counter() - started_at) * 1000, 3)
        return {
            "success": False,
            "result": None,
            "logs": [f"Blender failed {request.tool} in {duration_ms}ms"],
            "error": str(error),
        }
