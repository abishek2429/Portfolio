export const exhaustVertexShader = /* glsl */ `
  attribute float aSize;
  attribute float aLife;
  attribute float aRandom;
  
  uniform float uTime;
  uniform float uPixelRatio;
  
  varying float vLife;
  varying float vRandom;
  
  void main() {
    vLife = aLife;
    vRandom = aRandom;
    
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    float size = aSize * uPixelRatio * (180.0 / -mvPosition.z);
    gl_PointSize = size;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

export const exhaustFragmentShader = /* glsl */ `
  uniform vec3 uColorInner;
  uniform vec3 uColorOuter;
  
  varying float vLife;
  varying float vRandom;
  
  void main() {
    // Soft circle
    float dist = length(gl_PointCoord - vec2(0.5));
    if (dist > 0.5) discard;
    
    float softEdge = 1.0 - smoothstep(0.1, 0.5, dist);
    float alpha = softEdge * vLife;
    
    vec3 color = mix(uColorOuter, uColorInner, vLife * vLife);
    color += vRandom * 0.1;
    
    gl_FragColor = vec4(color, alpha * 0.7);
  }
`;
