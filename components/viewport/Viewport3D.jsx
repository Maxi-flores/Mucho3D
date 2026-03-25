"use client";
import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Grid, OrbitControls, GizmoHelper, GizmoViewport } from "@react-three/drei";
import * as THREE from "three";

function EngineeringGrid() {
  return (
    <Grid
      args={[40, 40]}
      cellSize={1}
      cellThickness={0.4}
      cellColor="#00A3FF"
      sectionSize={5}
      sectionThickness={0.8}
      sectionColor="#0055AA"
      fadeDistance={30}
      fadeStrength={1.5}
      infiniteGrid
    />
  );
}

function FloatingNodes({ count = 12 }) {
  const meshRef = useRef();
  const positions = useMemo(() => {
    const pos = [];
    for (let i = 0; i < count; i++) {
      pos.push([
        (Math.random() - 0.5) * 16,
        Math.random() * 4 + 0.5,
        (Math.random() - 0.5) * 16,
      ]);
    }
    return pos;
  }, [count]);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.children.forEach((mesh, i) => {
        mesh.position.y =
          positions[i][1] + Math.sin(clock.elapsedTime * 0.8 + i) * 0.3;
        mesh.rotation.y = clock.elapsedTime * 0.3 + i;
      });
    }
  });

  return (
    <group ref={meshRef}>
      {positions.map((pos, i) => (
        <mesh key={i} position={pos}>
          <octahedronGeometry args={[0.12, 0]} />
          <meshStandardMaterial
            color="#00A3FF"
            emissive="#003366"
            emissiveIntensity={0.8}
            transparent
            opacity={0.85}
          />
        </mesh>
      ))}
    </group>
  );
}

function ConnectionLines({ count = 8 }) {
  const lineRef = useRef();
  const points = useMemo(() => {
    const pts = [];
    for (let i = 0; i < count; i++) {
      pts.push(
        new THREE.Vector3(
          (Math.random() - 0.5) * 14,
          Math.random() * 3,
          (Math.random() - 0.5) * 14
        )
      );
    }
    return pts;
  }, [count]);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    return geo;
  }, [points]);

  return (
    <line ref={lineRef} geometry={geometry}>
      <lineBasicMaterial color="#00A3FF" transparent opacity={0.25} />
    </line>
  );
}

export default function Viewport3D({ className = "" }) {
  return (
    <div className={`w-full h-full ${className}`}>
      <Canvas
        camera={{ position: [8, 6, 10], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={0.2} />
        <directionalLight position={[5, 10, 5]} intensity={0.5} color="#00A3FF" />
        <pointLight position={[0, 8, 0]} intensity={0.8} color="#00A3FF" />

        <EngineeringGrid />
        <FloatingNodes count={14} />
        <ConnectionLines count={10} />

        <OrbitControls
          enablePan={false}
          enableZoom={false}
          autoRotate
          autoRotateSpeed={0.4}
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI / 2.5}
        />
        <GizmoHelper alignment="bottom-right" margin={[60, 60]}>
          <GizmoViewport
            axisColors={["#FF4466", "#44FF88", "#00A3FF"]}
            labelColor="white"
          />
        </GizmoHelper>
      </Canvas>
    </div>
  );
}
