# Mucho3D Blender Worker

Minimal HTTP worker for executing validated MCP tool calls inside Blender.

Run with Blender's Python environment after installing dependencies into that environment:

```powershell
python -m pip install -r requirements.txt
blender --background --python-expr "import uvicorn; uvicorn.run('server:app', host='127.0.0.1', port=7860)"
```

Endpoints:

- `GET /health`
- `POST /execute`

The worker only accepts whitelisted tools implemented in `run_tool.py`. It never accepts or executes raw Python from model output.
