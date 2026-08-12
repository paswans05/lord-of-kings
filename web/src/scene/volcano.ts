import * as THREE from "three";
import type { ArenaLook } from "./arena";
import { sparkTexture } from "./textures";
import { QUALITY_SETTINGS, type QualityPreset } from "./quality";

const MAX_EMBERS = 350;

/**
 * Volcanic Citadel environmental FX for the Obsidian Rift map:
 * - Drifting molten embers rising into the air with turbulence.
 * - Molten lava glow discs situated around the outer moat.
 * - Pulsing magma atmosphere.
 */
export class VolcanoOverlay {
  readonly group = new THREE.Group();

  private embers: THREE.Points | null = null;
  private emberPositions: Float32Array = new Float32Array(0);
  private emberVelocities: Float32Array = new Float32Array(0);
  private emberPhases: Float32Array = new Float32Array(0);
  private emberMaterial: THREE.PointsMaterial | null = null;

  private lavaGlows: THREE.PointLight[] = [];
  private lavaDiscMaterials: THREE.MeshBasicMaterial[] = [];
  private disposables: { dispose: () => void }[] = [];
  private elapsed = 0;
  private enabled = false;

  constructor(quality: QualityPreset, look: ArenaLook) {
    this.group.name = "volcano_overlay";
    this.buildEmbers();
    this.buildLavaGlows();
    this.applyQuality(quality);
    this.applyArena(look);
  }

  private track<T extends { dispose: () => void }>(item: T): T {
    this.disposables.push(item);
    return item;
  }

  private buildEmbers(): void {
    const geometry = this.track(new THREE.BufferGeometry());
    this.emberPositions = new Float32Array(MAX_EMBERS * 3);
    this.emberVelocities = new Float32Array(MAX_EMBERS * 3);
    this.emberPhases = new Float32Array(MAX_EMBERS);

    for (let i = 0; i < MAX_EMBERS; i += 1) {
      this.resetEmber(i, true);
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(this.emberPositions, 3));
    const texture = this.track(sparkTexture());

    this.emberMaterial = this.track(
      new THREE.PointsMaterial({
        size: 0.45,
        map: texture,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        color: 0xff6600,
        opacity: 0.85,
      }),
    );

    this.embers = new THREE.Points(geometry, this.emberMaterial);
    this.group.add(this.embers);
  }

  private resetEmber(i: number, randomY = false): void {
    const r = 4 + Math.random() * 22;
    const theta = Math.random() * Math.PI * 2;
    this.emberPositions[i * 3] = Math.cos(theta) * r;
    this.emberPositions[i * 3 + 1] = randomY ? Math.random() * 12 : -0.5;
    this.emberPositions[i * 3 + 2] = Math.sin(theta) * r;

    // Upward buoyancy + slight horizontal drift
    this.emberVelocities[i * 3] = (Math.random() - 0.5) * 0.4;
    this.emberVelocities[i * 3 + 1] = 0.6 + Math.random() * 1.2;
    this.emberVelocities[i * 3 + 2] = (Math.random() - 0.5) * 0.4;
    this.emberPhases[i] = Math.random() * Math.PI * 2;
  }

  private buildLavaGlows(): void {
    // 4 molten lava pools around the perimeter of the courtyard
    const angles = [0.4, 2.0, 3.6, 5.1];
    const radius = 18;

    for (let i = 0; i < angles.length; i += 1) {
      const x = Math.cos(angles[i]) * radius;
      const z = Math.sin(angles[i]) * radius;

      const light = new THREE.PointLight(0xff3300, 3.5, 20);
      light.position.set(x, 0.5, z);
      this.group.add(light);
      this.lavaGlows.push(light);

      // Emissive disc on ground
      const geom = this.track(new THREE.CircleGeometry(2.5, 16));
      const mat = this.track(
        new THREE.MeshBasicMaterial({
          color: 0xff4400,
          transparent: true,
          opacity: 0.6,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }),
      );
      this.lavaDiscMaterials.push(mat);

      const disc = new THREE.Mesh(geom, mat);
      disc.rotation.x = -Math.PI / 2;
      disc.position.set(x, -0.6, z);
      this.group.add(disc);
    }
  }

  applyArena(look: ArenaLook): void {
    this.enabled = look.id === "volcano";
    this.group.visible = this.enabled;

    if (!this.enabled) return;

    if (this.emberMaterial) {
      this.emberMaterial.color.setHex(look.sky.ember);
    }
  }

  applyQuality(preset: QualityPreset): void {
    const q = QUALITY_SETTINGS[preset];
    if (this.embers) {
      const count = Math.min(MAX_EMBERS, Math.floor((MAX_EMBERS * q.shadowMapSize) / 2048));
      this.embers.geometry.setDrawRange(0, count);
    }
  }

  update(delta: number, _camera: THREE.Camera): void {
    if (!this.enabled || !this.embers) return;

    this.elapsed += delta;
    const positions = this.emberPositions;

    for (let i = 0; i < MAX_EMBERS; i += 1) {
      positions[i * 3] += (this.emberVelocities[i * 3] + Math.sin(this.elapsed * 2 + this.emberPhases[i]) * 0.2) * delta;
      positions[i * 3 + 1] += this.emberVelocities[i * 3 + 1] * delta;
      positions[i * 3 + 2] += (this.emberVelocities[i * 3 + 2] + Math.cos(this.elapsed * 1.8 + this.emberPhases[i]) * 0.2) * delta;

      if (positions[i * 3 + 1] > 14) {
        this.resetEmber(i, false);
      }
    }

    (this.embers.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;

    // Pulse lava glows softly
    for (let i = 0; i < this.lavaGlows.length; i += 1) {
      const pulse = Math.sin(this.elapsed * 3 + i * 1.5) * 0.25 + 1;
      this.lavaGlows[i].intensity = 3.5 * pulse;
      this.lavaDiscMaterials[i].opacity = 0.5 * pulse;
    }
  }

  dispose(): void {
    for (const item of this.disposables) {
      item.dispose();
    }
    this.disposables = [];
  }
}
