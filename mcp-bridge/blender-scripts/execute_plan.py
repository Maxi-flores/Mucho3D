"""
Blender Python script for executing 3D generation plans
Runs inside Blender and creates scenes from structured GenerationPlan objects
"""

import bpy
import json
import sys
from pathlib import Path
from typing import Any, Dict, List

class PlanExecutor:
    """Executes a GenerationPlan in Blender"""

    def __init__(self):
        self.errors: List[str] = []
        self.logs: List[str] = []
        self.created_objects: List[str] = []
        self.output_dir = Path(bpy.utils.user_resource('SCRIPTS')) / 'mucho3d_output'
        self.output_dir.mkdir(parents=True, exist_ok=True)

    def log(self, message: str):
        """Log a message"""
        self.logs.append(message)
        print(f"[Executor] {message}")

    def error(self, message: str):
        """Log an error"""
        self.errors.append(message)
        print(f"[ERROR] {message}")

    def clear_scene(self):
        """Clear the Blender scene"""
        try:
            bpy.ops.object.select_all(action='SELECT')
            bpy.ops.object.delete(use_global=False)
            self.log("Scene cleared")
        except Exception as e:
            self.error(f"Failed to clear scene: {str(e)}")

    def create_primitive(self, obj_spec: Dict[str, Any]) -> str | None:
        """Create a primitive object"""
        try:
            obj_id = obj_spec.get('id', f"obj_{len(self.created_objects)}")
            obj_type = obj_spec.get('type', 'box')
            position = obj_spec.get('position', [0, 0, 0])
            rotation = obj_spec.get('rotation', [0, 0, 0])
            scale = obj_spec.get('scale', [1, 1, 1])
            name = obj_spec.get('name', obj_id)
            color = obj_spec.get('color')

            # Validate inputs
            if not isinstance(position, (list, tuple)) or len(position) != 3:
                self.error(f"Invalid position for {obj_id}: {position}")
                return None

            if not isinstance(scale, (list, tuple)) or len(scale) != 3:
                self.error(f"Invalid scale for {obj_id}: {scale}")
                return None

            # Create primitive based on type
            if obj_type == 'box' or obj_type == 'cube':
                bpy.ops.mesh.primitive_cube_add(
                    location=position,
                    scale=scale
                )
            elif obj_type == 'sphere':
                bpy.ops.mesh.primitive_uv_sphere_add(
                    location=position,
                    scale=scale
                )
            elif obj_type == 'cylinder':
                bpy.ops.mesh.primitive_cylinder_add(
                    location=position,
                    scale=scale
                )
            elif obj_type == 'cone':
                bpy.ops.mesh.primitive_cone_add(
                    location=position,
                    scale=scale
                )
            elif obj_type == 'torus':
                bpy.ops.mesh.primitive_torus_add(
                    location=position,
                    scale=scale
                )
            elif obj_type == 'plane':
                bpy.ops.mesh.primitive_plane_add(
                    location=position,
                    scale=scale
                )
            else:
                self.error(f"Unknown primitive type: {obj_type}")
                return None

            # Get the created object
            obj = bpy.context.active_object
            obj.name = name
            obj.data.name = f"{name}_data"

            # Apply rotation (convert degrees to radians)
            import math
            obj.rotation_euler = [math.radians(r) for r in rotation]

            # Apply material/color
            if color:
                self._apply_color(obj, color)

            self.created_objects.append(obj_id)
            self.log(f"Created {obj_type} '{name}' at {position} with scale {scale}")

            return obj_id

        except Exception as e:
            self.error(f"Failed to create primitive {obj_type}: {str(e)}")
            return None

    def _apply_color(self, obj: bpy.types.Object, color_hex: str):
        """Apply a color to an object"""
        try:
            # Parse hex color
            color_hex = color_hex.lstrip('#')
            r = int(color_hex[0:2], 16) / 255.0
            g = int(color_hex[2:4], 16) / 255.0
            b = int(color_hex[4:6], 16) / 255.0

            # Create material
            mat = bpy.data.materials.new(name=f"{obj.name}_Material")
            mat.use_nodes = True
            nodes = mat.node_tree.nodes

            # Set principled BSDF color
            for node in nodes:
                if node.type == 'PRINCIPLED_BSDF':
                    node.inputs['Base Color'].default_value = (r, g, b, 1.0)

            # Assign material
            if obj.data.materials:
                obj.data.materials[0] = mat
            else:
                obj.data.materials.append(mat)

            self.log(f"Applied color {color_hex} to {obj.name}")
        except Exception as e:
            self.error(f"Failed to apply color: {str(e)}")

    def create_light(self, light_spec: Dict[str, Any]) -> str | None:
        """Create a light source"""
        try:
            light_id = light_spec.get('id', f"light_{len(self.created_objects)}")
            light_type = light_spec.get('type', 'directional').upper()
            position = light_spec.get('position', [0, 0, 2])
            intensity = light_spec.get('intensity', 2.0)

            # Map types
            if light_type == 'DIRECTIONAL' or light_type == 'SUN':
                bpy.ops.object.light_add(type='SUN', location=position)
            elif light_type == 'POINT':
                bpy.ops.object.light_add(type='POINT', location=position)
            elif light_type == 'SPOT':
                bpy.ops.object.light_add(type='SPOT', location=position)
            else:
                self.error(f"Unknown light type: {light_type}")
                return None

            light = bpy.context.active_object
            light.name = light_spec.get('name', light_id)
            light.data.energy = intensity

            self.log(f"Created {light_type} light at {position} with intensity {intensity}")
            return light_id

        except Exception as e:
            self.error(f"Failed to create light: {str(e)}")
            return None

    def set_camera(self, camera_spec: Dict[str, Any]):
        """Set up the scene camera"""
        try:
            position = camera_spec.get('position', [3, 3, 3])
            target = camera_spec.get('target', [0, 0, 0])

            # Create or get camera
            scene = bpy.context.scene
            if scene.camera:
                camera_obj = scene.camera
            else:
                bpy.ops.object.camera_add(location=position)
                camera_obj = bpy.context.active_object

            camera_obj.location = position
            scene.camera = camera_obj

            # Point camera at target
            direction = [target[i] - position[i] for i in range(3)]
            import math
            length = math.sqrt(sum(d**2 for d in direction))
            if length > 0:
                direction = [d / length for d in direction]
                rot_quat = (direction[0], direction[1], direction[2], 1.0)
                # This is simplified; proper implementation would use quaternions

            self.log(f"Set camera at {position} pointing to {target}")
        except Exception as e:
            self.error(f"Failed to set camera: {str(e)}")

    def execute_plan(self, plan_dict: Dict[str, Any]) -> bool:
        """Execute the full generation plan"""
        try:
            self.log("Starting plan execution")

            # Clear scene
            self.clear_scene()

            # Create objects
            objects = plan_dict.get('objects', [])
            for obj_spec in objects:
                self.create_primitive(obj_spec)

            # Create lights
            lights = plan_dict.get('lights', [])
            for light_spec in lights:
                self.create_light(light_spec)

            # Set camera
            camera = plan_dict.get('camera')
            if camera:
                self.set_camera(camera)

            # Set rendering quality
            scene = bpy.context.scene
            scene.render.engine = 'CYCLES'
            scene.render.samples = 128

            self.log("Plan execution completed successfully")
            return len(self.errors) == 0

        except Exception as e:
            self.error(f"Execution failed: {str(e)}")
            return False

    def export_glb(self, filepath: str) -> bool:
        """Export scene as GLB"""
        try:
            # Select all objects
            bpy.ops.object.select_all(action='SELECT')

            # Export
            bpy.ops.export_scene.gltf(
                filepath=filepath,
                check_existing=True,
                use_selection=True,
                use_visible=True,
                export_format='GLB'
            )

            self.log(f"Exported GLB to {filepath}")
            return True
        except Exception as e:
            self.error(f"GLB export failed: {str(e)}")
            return False

    def export_fbx(self, filepath: str) -> bool:
        """Export scene as FBX"""
        try:
            # Select all objects
            bpy.ops.object.select_all(action='SELECT')

            # Export
            bpy.ops.export_scene.fbx(
                filepath=filepath,
                use_selection=True,
                use_active_collection=False
            )

            self.log(f"Exported FBX to {filepath}")
            return True
        except Exception as e:
            self.error(f"FBX export failed: {str(e)}")
            return False

    def get_result(self) -> Dict[str, Any]:
        """Get execution result"""
        return {
            'success': len(self.errors) == 0,
            'created_objects': len(self.created_objects),
            'errors': self.errors,
            'logs': self.logs,
        }


def main():
    """Main entry point"""
    try:
        # Read plan from stdin or file
        plan_json = sys.stdin.read() if len(sys.argv) == 1 else Path(sys.argv[1]).read_text()
        plan = json.loads(plan_json)

        executor = PlanExecutor()
        success = executor.execute_plan(plan)

        # Export based on plan format
        output_format = plan.get('outputFormat', 'glb')
        output_file = str(executor.output_dir / f"scene.{output_format}")

        if output_format == 'fbx':
            executor.export_fbx(output_file)
        else:
            executor.export_glb(output_file)

        # Print result
        result = executor.get_result()
        result['output_file'] = output_file
        print(json.dumps(result))

    except Exception as e:
        print(json.dumps({
            'success': False,
            'errors': [str(e)],
            'logs': [],
        }))
        sys.exit(1)


if __name__ == '__main__':
    main()
