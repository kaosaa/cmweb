import type { ComponentType, SVGProps } from 'react'

export type ToolMeta = {
  label: string
  description: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
  color: string
  bgColor: string
}

