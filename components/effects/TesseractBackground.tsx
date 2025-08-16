"use client"

import { useRef, useEffect } from 'react'
import * as THREE from 'three'

export default function TesseractBackground() {
  const mountRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<{
    scene?: THREE.Scene
    camera?: THREE.PerspectiveCamera
    renderer?: THREE.WebGLRenderer
    tesseract?: THREE.Group
    animationId?: number
  }>({})

  useEffect(() => {
    if (!mountRef.current) return
    
    // Capture the current mount element for cleanup
    const mountElement = mountRef.current

    // Scene setup
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
    const renderer = new THREE.WebGLRenderer({ 
      alpha: true, 
      antialias: false, // Disable antialiasing for better performance
      powerPreference: "high-performance",
      stencil: false,
      depth: false
    })
    
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setClearColor(0x000000, 0)
    mountElement.appendChild(renderer.domElement)

    // Tesseract vertices in 4D space
    const vertices4D = [
      [-1, -1, -1, -1], [1, -1, -1, -1], [-1, 1, -1, -1], [1, 1, -1, -1],
      [-1, -1, 1, -1], [1, -1, 1, -1], [-1, 1, 1, -1], [1, 1, 1, -1],
      [-1, -1, -1, 1], [1, -1, -1, 1], [-1, 1, -1, 1], [1, 1, -1, 1],
      [-1, -1, 1, 1], [1, -1, 1, 1], [-1, 1, 1, 1], [1, 1, 1, 1]
    ]

    // Tesseract edges (connecting vertices)
    const edges = [
      // Inner cube (w = -1)
      [0, 1], [1, 3], [3, 2], [2, 0],
      [4, 5], [5, 7], [7, 6], [6, 4],
      [0, 4], [1, 5], [2, 6], [3, 7],
      // Outer cube (w = 1)
      [8, 9], [9, 11], [11, 10], [10, 8],
      [12, 13], [13, 15], [15, 14], [14, 12],
      [8, 12], [9, 13], [10, 14], [11, 15],
      // Connections between cubes
      [0, 8], [1, 9], [2, 10], [3, 11],
      [4, 12], [5, 13], [6, 14], [7, 15]
    ]

    // Project 4D to 3D
    function project4Dto3D(vertex4D: number[], w: number = 2): THREE.Vector3 {
      const distance = 2
      const factor = distance / (distance - vertex4D[3])
      return new THREE.Vector3(
        vertex4D[0] * factor,
        vertex4D[1] * factor,
        vertex4D[2] * factor
      )
    }

    // Create tesseract group
    const tesseract = new THREE.Group()

    // Create vertices with reduced geometry complexity
    const vertexGeometry = new THREE.SphereGeometry(0.03, 6, 6) // Reduced from 8,8 to 6,6
    const vertexMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xffffff, 
      transparent: true, 
      opacity: 1.0 
    })

    vertices4D.forEach(vertex => {
      const sphere = new THREE.Mesh(vertexGeometry, vertexMaterial)
      const pos3D = project4Dto3D(vertex)
      sphere.position.copy(pos3D)
      tesseract.add(sphere)
    })

    // Create edges with pulsing effect
    const edgeMaterial = new THREE.LineBasicMaterial({ 
      color: 0xffffff, 
      transparent: true, 
      opacity: 0.8,
      linewidth: 2
    })

    edges.forEach(edge => {
      const geometry = new THREE.BufferGeometry()
      const pos1 = project4Dto3D(vertices4D[edge[0]])
      const pos2 = project4Dto3D(vertices4D[edge[1]])
      
      geometry.setFromPoints([pos1, pos2])
      const line = new THREE.Line(geometry, edgeMaterial)
      tesseract.add(line)
    })

    scene.add(tesseract)
    camera.position.z = 5

    sceneRef.current = { scene, camera, renderer, tesseract }

    // Animation loop with throttling for better performance
    let lastFrameTime = 0
    const targetFPS = 45 // Increase to 45 FPS for smoother background effects
    const frameInterval = 1000 / targetFPS
    
    function animate(currentTime: number = 0) {
      const animationId = requestAnimationFrame(animate)
      sceneRef.current.animationId = animationId

      // Throttle animation to target FPS
      if (currentTime - lastFrameTime < frameInterval) {
        return
      }
      lastFrameTime = currentTime

      if (tesseract) {
        // Rotate the tesseract in multiple dimensions
        tesseract.rotation.x += 0.005
        tesseract.rotation.y += 0.008
        tesseract.rotation.z += 0.003

        // Update vertex and edge positions for 4D rotation
        const time = Date.now() * 0.001
        
        // Pulsing effect for edges
        const pulseIntensity = 0.3 + 0.7 * (Math.sin(time * 2) * 0.5 + 0.5)
        const secondaryPulse = 0.2 + 0.8 * (Math.sin(time * 3.5 + Math.PI) * 0.5 + 0.5)
        
        vertices4D.forEach((vertex, index) => {
          // 4D rotation matrices (simplified)
          const rotatedVertex = [
            vertex[0] * Math.cos(time * 0.5) - vertex[3] * Math.sin(time * 0.5),
            vertex[1],
            vertex[2] * Math.cos(time * 0.3) - vertex[3] * Math.sin(time * 0.3),
            vertex[0] * Math.sin(time * 0.5) + vertex[3] * Math.cos(time * 0.5)
          ]
          
          const pos3D = project4Dto3D(rotatedVertex)
          const sphere = tesseract.children[index] as THREE.Mesh
          sphere.position.copy(pos3D)
          
          // Vertex pulsing brightness
          const vertexMaterial = sphere.material as THREE.MeshBasicMaterial
          vertexMaterial.opacity = 0.8 + 0.2 * Math.sin(time * 4 + index * 0.5)
        })

        // Update edges with pulsing effect
        edges.forEach((edge, edgeIndex) => {
          const lineIndex = vertices4D.length + edgeIndex
          const line = tesseract.children[lineIndex] as THREE.Line
          const geometry = line.geometry as THREE.BufferGeometry
          const lineMaterial = line.material as THREE.LineBasicMaterial
          
          const vertex1 = vertices4D[edge[0]]
          const vertex2 = vertices4D[edge[1]]
          
          const rotatedVertex1 = [
            vertex1[0] * Math.cos(time * 0.5) - vertex1[3] * Math.sin(time * 0.5),
            vertex1[1],
            vertex1[2] * Math.cos(time * 0.3) - vertex1[3] * Math.sin(time * 0.3),
            vertex1[0] * Math.sin(time * 0.5) + vertex1[3] * Math.cos(time * 0.5)
          ]
          
          const rotatedVertex2 = [
            vertex2[0] * Math.cos(time * 0.5) - vertex2[3] * Math.sin(time * 0.5),
            vertex2[1],
            vertex2[2] * Math.cos(time * 0.3) - vertex2[3] * Math.sin(time * 0.3),
            vertex2[0] * Math.sin(time * 0.5) + vertex2[3] * Math.cos(time * 0.5)
          ]
          
          const pos1 = project4Dto3D(rotatedVertex1)
          const pos2 = project4Dto3D(rotatedVertex2)
          
          geometry.setFromPoints([pos1, pos2])
          
          // Pulsing edge brightness with different patterns
          const edgePulse = edgeIndex % 2 === 0 ? pulseIntensity : secondaryPulse
          const phaseOffset = edgeIndex * 0.2
          const brightness = edgePulse * (0.6 + 0.4 * Math.sin(time * 5 + phaseOffset))
          
          lineMaterial.opacity = Math.min(brightness, 1.0)
          
          // Color shifting for extra effect
          const hue = (time * 0.1 + edgeIndex * 0.1) % 1
          const color = new THREE.Color().setHSL(hue * 0.2, 0.3, 0.9) // Subtle blue-white shift
          lineMaterial.color = color
        })
      }

      renderer.render(scene, camera)
    }

    animate()

    // Handle resize
    const handleResize = () => {
      if (!camera || !renderer) return
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }

    window.addEventListener('resize', handleResize)

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize)
      if (sceneRef.current.animationId) {
        cancelAnimationFrame(sceneRef.current.animationId)
      }
      if (mountElement && renderer.domElement) {
        mountElement.removeChild(renderer.domElement)
      }
      renderer.dispose()
    }
  }, [])

  return (
    <div 
      ref={mountRef} 
      className="absolute inset-0 pointer-events-none opacity-75 gpu-accelerated"
      style={{ zIndex: 1 }}
    />
  )
}
