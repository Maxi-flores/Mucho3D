from __future__ import annotations

import base64
import math
import os
import uuid
from pathlib import Path
from typing import Any
from urllib.parse import urlparse
from urllib.request import urlretrieve

try:
    import bpy  # type: ignore
except ImportError:  # Allows HTTP server imports outside Blender for health checks/tests.
    bpy = None  # type: ignore


Vector3 = tuple[float, float, float]
ALLOWED_TOOLS = {"create_primitive", "transform_object", "apply_material", "import_asset", "export_scene"}
ALLOWED_PRIMITIVES = {"box", "cube", "sphere", "cylinder"}
EXPORT_DIR = Path(os.environ.get("BLENDER_WORKER_EXPORT_DIR", Path.cwd() / "exports"))
SNAPSHOT_DIR = Path(os.environ.get("BLENDER_WORKER_SNAPSHOT_DIR", Path.cwd() / "snapshots"))
ASSET_DIR = Path(os.environ.get("BLENDER_WORKER_ASSET_DIR", Path.cwd() / "assets"))
ASSET_CACHE_DIR = Path(os.environ.get("BLENDER_WORKER_ASSET_CACHE_DIR", Path.cwd() / ".asset-cache"))
ASSET_QUERY_MAP: dict[str, str] = {
    "modern chair": "modern-chair.glb",
    "chair": "chair.glb",
    "modern table": "modern-table.glb",
    "table": "table.glb",
}


def execute_tool(tool: str, payload: dict[str, Any]) -> dict[str, Any]:
    if tool not in ALLOWED_TOOLS:
        raise ValueError(f"Unknown tool: {tool}")
    if bpy is None:
        raise RuntimeError("Blender bpy module is not available. Start this worker inside Blender.")

    if tool == "create_primitive":
        return create_primitive(payload)
    if tool == "transform_object":
        return transform_object(payload)
    if tool == "apply_material":
        return apply_material(payload)
    if tool == "import_asset":
        return import_asset(payload)
    if tool == "export_scene":
        return export_scene(payload)

    raise ValueError(f"Unhandled tool: {tool}")


def create_primitive(payload: dict[str, Any]) -> dict[str, Any]:
    primitive_type = normalize_primitive_type(payload.get("primitiveType") or payload.get("type"))
    object_id = safe_id(payload.get("id") or f"obj_{primitive_type}_{len(bpy.data.objects)}")
    name = str(payload.get("name") or object_id)[:100]
    position = parse_vector3(payload.get("position"), (0.0, 0.0, 0.0))
    rotation = parse_vector3(payload.get("rotation"), (0.0, 0.0, 0.0))
    scale = parse_vector3(payload.get("scale"), (1.0, 1.0, 1.0))

    if primitive_type == "box":
        bpy.ops.mesh.primitive_cube_add(size=1, location=position, rotation=rotation)
    elif primitive_type == "sphere":
        bpy.ops.mesh.primitive_uv_sphere_add(segments=32, ring_count=16, location=position, rotation=rotation)
    elif primitive_type == "cylinder":
        bpy.ops.mesh.primitive_cylinder_add(vertices=32, radius=0.5, depth=1, location=position, rotation=rotation)

    obj = bpy.context.object
    obj.name = name
    obj["mcp_object_id"] = object_id
    obj.scale = scale
    apply_color(obj, str(payload.get("color") or "#FFFFFF"))

    return {
        "objectId": object_id,
        "objectType": primitive_type,
        "name": name,
        "object": object_to_result(obj, object_id, primitive_type),
    }


def transform_object(payload: dict[str, Any]) -> dict[str, Any]:
    object_id = required_string(payload, "objectId")
    obj = find_object(object_id)
    if obj is None:
        raise ValueError(f"Object not found: {object_id}")

    if "position" in payload:
        obj.location = parse_vector3(payload.get("position"), tuple(obj.location))
    if "rotation" in payload:
        obj.rotation_euler = parse_vector3(payload.get("rotation"), tuple(obj.rotation_euler))
    if "scale" in payload:
        obj.scale = parse_vector3(payload.get("scale"), tuple(obj.scale))

    return {
        "objectId": object_id,
        "transformed": True,
        "transform": {
            "position": list(obj.location),
            "rotation": list(obj.rotation_euler),
            "scale": list(obj.scale),
        },
    }


def apply_material(payload: dict[str, Any]) -> dict[str, Any]:
    object_id = required_string(payload, "objectId")
    obj = find_object(object_id)
    if obj is None:
        raise ValueError(f"Object not found: {object_id}")

    color = payload.get("color")
    if color:
        apply_color(obj, str(color))

    material = ensure_material(obj)
    material.diffuse_color = hex_to_rgba(str(color or "#FFFFFF"))
    material.use_nodes = True
    bsdf = material.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Metallic"].default_value = clamp_float(payload.get("metallic", 0), 0, 1)
        bsdf.inputs["Roughness"].default_value = clamp_float(payload.get("roughness", 0.5), 0, 1)

    return {
        "objectId": object_id,
        "materialApplied": True,
        "material": {
            "color": color,
            "metallic": clamp_float(payload.get("metallic", 0), 0, 1),
            "roughness": clamp_float(payload.get("roughness", 0.5), 0, 1),
        },
    }


def export_scene(payload: dict[str, Any]) -> dict[str, Any]:
    export_format = str(payload.get("format") or "glb").lower()
    if export_format not in {"glb", "fbx"}:
        raise ValueError("format must be glb or fbx")

    filename = safe_filename(str(payload.get("filename") or f"scene.{export_format}"))
    if not filename.endswith(f".{export_format}"):
        filename = f"{filename}.{export_format}"

    EXPORT_DIR.mkdir(parents=True, exist_ok=True)
    path = EXPORT_DIR / filename

    if export_format == "glb":
        bpy.ops.export_scene.gltf(filepath=str(path), export_format="GLB")
    else:
        bpy.ops.export_scene.fbx(filepath=str(path))

    return {
        "format": export_format,
        "path": str(path),
    }


def import_asset(payload: dict[str, Any]) -> dict[str, Any]:
    query = required_string(payload, "query").strip().lower()
    source = payload.get("source")
    object_id = safe_id(payload.get("objectId") or f"asset_{query.replace(' ', '_')}")
    location = parse_vector3(payload.get("location"), (0.0, 0.0, 0.0))
    rotation = parse_vector3(payload.get("rotation"), (0.0, 0.0, 0.0))
    scale = parse_vector3(payload.get("scale"), (1.0, 1.0, 1.0))
    asset_path = resolve_asset_path(query, source)
    imported_before = {obj.name for obj in bpy.data.objects}

    if asset_path.suffix.lower() in {".glb", ".gltf"}:
        bpy.ops.import_scene.gltf(filepath=str(asset_path))
    elif asset_path.suffix.lower() == ".obj":
        bpy.ops.wm.obj_import(filepath=str(asset_path))
    else:
        raise ValueError(f"Unsupported asset format: {asset_path.suffix.lower()}")

    imported_objects = [obj for obj in bpy.data.objects if obj.name not in imported_before]
    if not imported_objects:
        raise RuntimeError("Asset import did not create any objects")

    base_name = query.replace(" ", "_")
    for index, obj in enumerate(imported_objects):
        obj.name = unique_object_name(base_name if index == 0 else f"{base_name}_{index}")
        obj["mcp_object_id"] = object_id if index == 0 else f"{object_id}_{index}"
        obj.location = location
        obj.rotation_euler = rotation
        obj.scale = scale

    primary = imported_objects[0]
    return {
        "objectId": object_id,
        "query": query,
        "path": str(asset_path),
        "imported": True,
        "object": object_to_result(primary, object_id, "asset"),
    }


def normalize_primitive_type(value: Any) -> str:
    primitive_type = str(value or "").lower()
    if primitive_type == "cube":
        return "box"
    if primitive_type not in {"box", "sphere", "cylinder"}:
        raise ValueError(f"Unsupported primitive type: {primitive_type}")
    return primitive_type


def parse_vector3(value: Any, default: Vector3) -> Vector3:
    if value is None:
        return default
    if not isinstance(value, list | tuple) or len(value) != 3:
        raise ValueError("Expected vector3")
    return tuple(clamp_float(item, -1000, 1000) for item in value)  # type: ignore[return-value]


def clamp_float(value: Any, minimum: float, maximum: float) -> float:
    number = float(value)
    if not math.isfinite(number):
        raise ValueError("Numeric values must be finite")
    return max(minimum, min(maximum, number))


def required_string(payload: dict[str, Any], key: str) -> str:
    value = payload.get(key)
    if not isinstance(value, str) or not value:
        raise ValueError(f"{key} is required")
    return value


def safe_id(value: Any) -> str:
    text = str(value)
    if not text or any(char for char in text if not (char.isalnum() or char in "_-")):
        raise ValueError("Invalid object id")
    return text[:128]


def safe_filename(value: str) -> str:
    if not value or any(char for char in value if not (char.isalnum() or char in "_.-")):
        raise ValueError("Invalid export filename")
    return value[:128]


def resolve_asset_path(query: str, source: Any) -> Path:
    if isinstance(source, str) and source:
        parsed_source = urlparse(source)
        if parsed_source.scheme in {"http", "https"}:
            return resolve_asset_source(source)
        raise ValueError("Asset source must be an http(s) URL")

    mapped = ASSET_QUERY_MAP.get(query)
    if mapped:
        mapped_path = ASSET_DIR / mapped
        if mapped_path.exists():
            return mapped_path

    normalized = query.replace(" ", "-")
    candidates = [
        ASSET_DIR / f"{normalized}.glb",
        ASSET_DIR / f"{normalized}.gltf",
        ASSET_DIR / f"{normalized}.obj",
        ASSET_DIR / f"{query}.glb",
        ASSET_DIR / f"{query}.obj",
    ]

    for candidate in candidates:
        if candidate.exists():
            return candidate

    raise ValueError(f"No asset found for query: {query}")


def resolve_asset_source(source: str) -> Path:
    parsed = urlparse(source)
    if parsed.scheme not in {"http", "https"}:
        raise ValueError("Asset source URL must use http or https")

    ASSET_CACHE_DIR.mkdir(parents=True, exist_ok=True)
    extension = Path(parsed.path).suffix.lower()
    if extension not in {".glb", ".gltf", ".obj"}:
        extension = ".glb"

    filename = f"asset_{uuid.uuid4().hex}{extension}"
    cached_path = ASSET_CACHE_DIR / filename
    urlretrieve(source, cached_path)
    return cached_path


def find_object(object_id: str):
    for obj in bpy.data.objects:
        if obj.get("mcp_object_id") == object_id or obj.name == object_id:
            return obj
    return None


def unique_object_name(base_name: str) -> str:
    candidate = safe_id(base_name)
    if candidate not in bpy.data.objects:
        return candidate

    index = 1
    while True:
        name = f"{candidate}_{index}"
        if name not in bpy.data.objects:
            return name
        index += 1


def ensure_material(obj):
    if obj.data.materials:
        return obj.data.materials[0]
    material = bpy.data.materials.new(name=f"{obj.name}_material")
    obj.data.materials.append(material)
    return material


def apply_color(obj, color: str) -> None:
    material = ensure_material(obj)
    material.diffuse_color = hex_to_rgba(color)


def hex_to_rgba(color: str) -> tuple[float, float, float, float]:
    if not isinstance(color, str) or len(color) != 7 or not color.startswith("#"):
        raise ValueError("Color must be #RRGGBB")
    return (
        int(color[1:3], 16) / 255,
        int(color[3:5], 16) / 255,
        int(color[5:7], 16) / 255,
        1.0,
    )


def object_to_result(obj, object_id: str, primitive_type: str) -> dict[str, Any]:
    return {
        "id": object_id,
        "type": primitive_type,
        "position": list(obj.location),
        "rotation": list(obj.rotation_euler),
        "scale": list(obj.scale),
        "transform": {
            "position": list(obj.location),
            "rotation": list(obj.rotation_euler),
            "scale": list(obj.scale),
        },
    }


def capture_viewport_snapshot() -> dict[str, Any]:
    """
    Capture a snapshot of the current Blender viewport.
    Returns a dictionary with the snapshot data (base64 encoded) and metadata.
    """
    if bpy is None:
        raise RuntimeError("Blender bpy module is not available")

    # Ensure snapshot directory exists
    SNAPSHOT_DIR.mkdir(parents=True, exist_ok=True)

    # Generate unique filename
    import time
    timestamp = int(time.time() * 1000)
    snapshot_filename = f"snapshot_{timestamp}.png"
    snapshot_path = SNAPSHOT_DIR / snapshot_filename

    # Store original render settings
    scene = bpy.context.scene
    original_filepath = scene.render.filepath
    original_resolution_x = scene.render.resolution_x
    original_resolution_y = scene.render.resolution_y
    original_file_format = scene.render.image_settings.file_format

    try:
        # Configure render settings for snapshot
        scene.render.filepath = str(snapshot_path)
        scene.render.resolution_x = 1920
        scene.render.resolution_y = 1080
        scene.render.image_settings.file_format = 'PNG'
        scene.render.image_settings.color_mode = 'RGBA'

        # Render the current viewport
        bpy.ops.render.render(write_still=True)

        # Read the rendered image and encode to base64
        with open(snapshot_path, 'rb') as f:
            image_data = f.read()
            base64_data = base64.b64encode(image_data).decode('utf-8')

        # Get file size
        file_size = len(image_data)

        return {
            "filename": snapshot_filename,
            "path": str(snapshot_path),
            "base64": base64_data,
            "format": "png",
            "width": 1920,
            "height": 1080,
            "size": file_size,
            "timestamp": timestamp
        }

    finally:
        # Restore original render settings
        scene.render.filepath = original_filepath
        scene.render.resolution_x = original_resolution_x
        scene.render.resolution_y = original_resolution_y
        scene.render.image_settings.file_format = original_file_format
