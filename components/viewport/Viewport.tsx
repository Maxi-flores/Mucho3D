import React, { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  OrbitControls,
  Environment,
  Grid,
  Float,
  MeshDistortMaterial,
} from "@react-three/drei";
import * as THREE from "three";
import styles from "./Viewport.module.css";

/** Animated torus knot with distortion */
function HeroGeometry() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.15;
      meshRef.current.rotation.x =
        Math.sin(state.clock.elapsedTime * 0.1) * 0.1;
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.5}>
      <mesh ref={meshRef} position={[0, 1, 0]}>
        <torusKnotGeometry args={[1.2, 0.4, 256, 64]} />
        <MeshDistortMaterial
          color="#00A3FF"
          emissive="#003366"
          emissiveIntensity={0.4}
          roughness={0.15}
          metalness={0.9}
          distort={0.2}
          speed={2}
        />
      </mesh>
    </Float>
  );
}

/** Secondary floating sphere */
function AccentSphere() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.y =
        2.5 + Math.sin(state.clock.elapsedTime * 0.8) * 0.3;
      meshRef.current.rotation.z = state.clock.elapsedTime * 0.3;
    }
  });

  return (
    <mesh ref={meshRef} position={[3, 2.5, -1]}>
      <icosahedronGeometry args={[0.5, 4]} />
      <meshStandardMaterial
        color="#1E293B"
        emissive="#00A3FF"
        emissiveIntensity={0.15}
        roughness={0.3}
        metalness={0.8}
        wireframe
      />
    </mesh>
  );
}

/** Ground grid lines */
function GroundGrid() {
  return (
    <Grid
      position={[0, -0.01, 0]}
      args={[20, 20]}
      cellSize={1}
      cellThickness={0.5}
      cellColor="#1a1a2e"
      sectionSize={5}
      sectionThickness={1}
      sectionColor="#0a0a1a"
      fadeDistance={30}
      fadeStrength={1}
      infiniteGrid
    />
  );
}

export default function Viewport() {
  return (
    <Canvas
      className={styles.viewportCanvas}
      camera={{ position: [5, 3.2, 8], fov: 45 }}
      gl={{
        antialias: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.2,
      }}
    >
      <color attach="background" args={["#050505"]} />
      <fog attach="fog" args={["#050505", 15, 35]} />

      {/* Lighting */}
      <ambientLight intensity={0.15} />
      <directionalLight
        position={[5, 8, 5]}
        intensity={1.2}
        color="#ffffff"
        castShadow
      />
      <pointLight position={[-4, 3, -4]} intensity={0.6} color="#00A3FF" />
      <pointLight position={[4, 2, 4]} intensity={0.3} color="#1E293B" />

      {/* Scene Objects */}
      <HeroGeometry />
      <AccentSphere />
      <GroundGrid />

      {/* Environment & Controls */}
      <Environment preset="night" />
      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        minDistance={3}
        maxDistance={20}
        maxPolarAngle={Math.PI / 2.1}
      />
    </Canvas>
  );
}
