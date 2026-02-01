import { X, ZoomIn, ZoomOut, RotateCw } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'

interface ImageViewerProps {
  src: string
  alt?: string
  isOpen: boolean
  onClose: () => void
}

export function ImageViewer({ src, alt, isOpen, onClose }: ImageViewerProps) {
  const [scale, setScale] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const startPos = useRef({ x: 0, y: 0 })

  // Reset state when opening a new image
  useEffect(() => {
    if (isOpen) {
      setScale(1)
      setRotation(0)
      setPosition({ x: 0, y: 0 })
    }
  }, [isOpen, src])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden' // Prevent background scroll
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleWheel = (e: React.WheelEvent) => {
    e.stopPropagation()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    setScale((s) => Math.min(Math.max(0.5, s * delta), 5))
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
    startPos.current = { x: e.clientX - position.x, y: e.clientY - position.y }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    setPosition({
      x: e.clientX - startPos.current.x,
      y: e.clientY - startPos.current.y,
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const content = (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Controls */}
      <div
        className="absolute top-4 right-4 flex items-center gap-2 z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          onClick={() => setScale((s) => Math.min(s + 0.5, 5))}
          title="放大"
        >
          <ZoomIn className="w-5 h-5" />
        </button>
        <button
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          onClick={() => setScale((s) => Math.max(s - 0.5, 0.5))}
          title="缩小"
        >
          <ZoomOut className="w-5 h-5" />
        </button>
        <button
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          onClick={() => setRotation((r) => r + 90)}
          title="旋转"
        >
          <RotateCw className="w-5 h-5" />
        </button>
        <button
          className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors ml-2"
          onClick={onClose}
          title="关闭"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Image Container */}
      <div
        className="relative w-full h-full overflow-hidden flex items-center justify-center p-4"
        onWheel={handleWheel}
      >
        <img
          src={src}
          alt={alt || 'Preview'}
          className={cn(
            "max-w-full max-h-full object-contain transition-transform duration-100 ease-out cursor-grab active:cursor-grabbing",
            isDragging ? "duration-0" : ""
          )}
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg)`,
          }}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          draggable={false}
        />
      </div>
    </div>
  )

  return createPortal(content, document.body)
}
