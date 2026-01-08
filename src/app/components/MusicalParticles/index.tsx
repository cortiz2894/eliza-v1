"use client";

import { useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import { useControls } from "leva";

interface Particle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  rotation: number;
  rotationSpeed: number;
  scale: number;
  life: number;
  maxLife: number;
  age: number;
  fadeInDuration: number;
}

function Particles() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const particlesRef = useRef<Particle[]>([]);
  const texture = useTexture("/images/particleMusical.png");

  const controls = useControls("Musical Particles", {
    maxParticles: { value: 40, min: 10, max: 300, step: 10 },
    spawnInterval: { value: 0.1, min: 0.01, max: 0.5, step: 0.01 },
    minScale: { value: 0.2, min: 0.05, max: 0.5, step: 0.05 },
    maxScale: { value: 0.6, min: 0.1, max: 1, step: 0.05 },
    velocityY: { value: 0.7, min: 0.5, max: 5, step: 0.1 },
    windStrength: { value: 0.5, min: 0, max: 2, step: 0.1 },
    spread: { value: 2, min: 0.5, max: 5, step: 0.5 },
    life: { value: 6, min: 1, max: 10, step: 0.5 },
    fadeInDuration: { value: 1, min: 0.1, max: 1, step: 0.1 },
    fadeOutDuration: { value: 0.5, min: 0.1, max: 2, step: 0.1 },
    rotationSpeed: { value: 0.03, min: 0, max: 0.1, step: 0.01 },
    globalOpacity: { value: 0.5, min: 0.1, max: 1, step: 0.1 },
  });

  const spawnTimerRef = useRef(0);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Initialize particles
  useEffect(() => {
    particlesRef.current = [];
    spawnTimerRef.current = 0;
  }, [controls.maxParticles]);

  const createParticle = () => {
    const scale =
      controls.minScale +
      Math.random() * (controls.maxScale - controls.minScale);

    // Random wind direction (left or right)
    const windDirection = Math.random() > 0.5 ? 1 : -1;

    const particle: Particle = {
      position: new THREE.Vector3(
        (Math.random() - 0.5) * controls.spread,
        -3, // Start from bottom
        0
      ),
      velocity: new THREE.Vector3(
        windDirection * controls.windStrength * (0.5 + Math.random() * 0.5), // Wind effect
        controls.velocityY + Math.random() * 0.5, // Upward movement
        0
      ),
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * controls.rotationSpeed,
      scale,
      life: controls.life,
      maxLife: controls.life,
      age: 0,
      fadeInDuration: controls.fadeInDuration,
    };

    return particle;
  };

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    // Always spawn and update particles
    // Spawn new particles based on timer
    spawnTimerRef.current += delta;
    if (
      spawnTimerRef.current >= controls.spawnInterval &&
      particlesRef.current.length < controls.maxParticles
    ) {
      particlesRef.current.push(createParticle());
      spawnTimerRef.current = 0;
    }

    // Update particles
    const activeParticles: Particle[] = [];
    particlesRef.current.forEach((particle) => {
      particle.life -= delta;
      particle.age += delta;
      particle.position.add(particle.velocity.clone().multiplyScalar(delta));
      particle.rotation += particle.rotationSpeed;

      // Calculate opacity with fade in/out
      let opacity = 1;

      // Fade in
      if (particle.age < particle.fadeInDuration) {
        opacity = particle.age / particle.fadeInDuration;
      }
      // Fade out
      else if (particle.life < controls.fadeOutDuration) {
        opacity = particle.life / controls.fadeOutDuration;
      }

      // Apply global opacity for subtle effect
      opacity = Math.max(0, Math.min(1, opacity)) * controls.globalOpacity;

      // Only keep alive particles
      if (particle.life > 0) {
        activeParticles.push(particle);
      }

      // Update instance
      dummy.position.copy(particle.position);
      dummy.rotation.z = particle.rotation;
      dummy.scale.setScalar(particle.scale * opacity);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(
        particlesRef.current.indexOf(particle),
        dummy.matrix
      );
    });

    // Remove dead particles
    particlesRef.current = activeParticles;

    // Hide unused instances
    for (let i = particlesRef.current.length; i < controls.maxParticles; i++) {
      dummy.scale.setScalar(0);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, controls.maxParticles]}
    >
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial
        map={texture}
        transparent
        opacity={1}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </instancedMesh>
  );
}

interface MusicalParticlesProps {
  isActive: boolean;
  position: {
    left: string;
    top: string;
    width: string;
    height: string;
    transform?: string;
  };
}

export default function MusicalParticles({
  isActive,
  position,
}: MusicalParticlesProps) {
  return (
    <div
      className="absolute pointer-events-none z-25 transition-opacity duration-1000"
      style={{
        left: position.left,
        top: position.top,
        width: position.width,
        height: position.height,
        transform: position.transform || "none",
        opacity: isActive ? 1 : 0,
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        gl={{ alpha: true, antialias: true }}
        style={{ pointerEvents: "none" }}
      >
        <Particles />
      </Canvas>
    </div>
  );
}
