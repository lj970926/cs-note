import type { QuartzComponentConstructor } from "@quartz-community/types"

export interface ParticleBackgroundOptions {
  particleCount?: number
  maxMobileParticles?: number
  maxLinkDistance?: number
  speed?: number
  opacity?: number
  mouseRadius?: number
  mouseStrength?: number
}

declare const ParticleBackground: QuartzComponentConstructor<ParticleBackgroundOptions>
export default ParticleBackground
