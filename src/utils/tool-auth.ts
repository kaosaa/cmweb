import {
  Eye,
  Search,
  Globe,
  ListTodo,
  FileCode,
  FileEdit,
  FileOutput,
  Terminal,
  Zap,
} from 'lucide-react'
import type { ToolMeta } from '@/types/tool-auth'

const DANGEROUS_TOOLS = ['Write', 'Edit', 'Bash', 'NotebookEdit']

export function isDangerousTool(toolName: string): boolean {
  return DANGEROUS_TOOLS.some((t) => toolName.toLowerCase().includes(t.toLowerCase()))
}

export function getToolMeta(toolName: string): ToolMeta {
  const lower = toolName.toLowerCase()

  if (lower.includes('bash'))
    return {
      label: '执行命令',
      description: '在终端中运行 Shell 命令',
      icon: Terminal,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
    }
  if (lower.includes('write'))
    return {
      label: '写入文件',
      description: '创建或覆盖文件内容',
      icon: FileOutput,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    }
  if (lower.includes('edit'))
    return {
      label: '编辑文件',
      description: '修改已有文件的部分内容',
      icon: FileEdit,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
    }
  if (lower.includes('notebookedit'))
    return {
      label: '编辑 Notebook',
      description: '修改 Jupyter Notebook 单元格',
      icon: FileCode,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
    }
  if (lower.includes('todowrite'))
    return {
      label: '更新任务列表',
      description: '修改任务追踪列表',
      icon: ListTodo,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    }
  if (lower.includes('read'))
    return {
      label: '读取文件',
      description: '读取文件内容',
      icon: Eye,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    }
  if (lower.includes('glob') || lower.includes('grep'))
    return {
      label: '搜索文件',
      description: '在项目中搜索文件或内容',
      icon: Search,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    }
  if (lower.includes('web'))
    return {
      label: '网络请求',
      description: '访问网络资源',
      icon: Globe,
      color: 'text-cyan-500',
      bgColor: 'bg-cyan-500/10',
    }

  return {
    label: toolName,
    description: '执行工具操作',
    icon: Zap,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
  }
}

export function getInputPreview(toolName: string, input: unknown): string | null {
  if (!input || typeof input !== 'object') return null
  const obj = input as Record<string, unknown>

  const lower = toolName.toLowerCase()
  if (lower.includes('bash')) {
    const cmd = obj.command ?? obj.cmd
    return typeof cmd === 'string' ? cmd : null
  }
  if (lower.includes('write') || lower.includes('edit') || lower.includes('read')) {
    const fp = obj.file_path ?? obj.filePath ?? obj.path
    return typeof fp === 'string' ? fp : null
  }
  if (lower.includes('glob')) {
    const p = obj.pattern
    return typeof p === 'string' ? `pattern: ${p}` : null
  }
  if (lower.includes('grep')) {
    const p = obj.pattern
    return typeof p === 'string' ? `grep: ${p}` : null
  }
  return null
}

