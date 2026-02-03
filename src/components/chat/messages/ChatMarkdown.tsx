import { isValidElement, useMemo, memo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkBreaks from 'remark-breaks'
import remarkGfm from 'remark-gfm'
import { cn } from '@/lib/utils'
import { ShikiCode } from '@/components/ShikiCode'
import { CodeBlock } from '@/components/ui/code-block'

// 将 components 提取到组件外部，避免每次渲染都创建新对象
const markdownComponents = {
  p: ({ children }: any) => <p className="whitespace-pre-wrap break-words leading-7 mb-2 last:mb-0">{children}</p>,
  h1: ({ children }: any) => <h1 className="text-xl font-bold leading-tight mt-4 mb-2 break-words">{children}</h1>,
  h2: ({ children }: any) => <h2 className="text-lg font-bold leading-tight mt-4 mb-2 break-words">{children}</h2>,
  h3: ({ children }: any) => <h3 className="text-base font-semibold leading-tight mt-3 mb-1 break-words">{children}</h3>,
  ul: ({ children }: any) => <ul className="ml-5 list-disc space-y-1 mb-2 break-words">{children}</ul>,
  ol: ({ children }: any) => <ol className="ml-5 list-decimal space-y-1 mb-2 break-words">{children}</ol>,
  li: ({ children }: any) => <li className="leading-7 break-words">{children}</li>,
  a: ({ href, children }: any) => (
    <a
      href={href ?? '#'}
      target="_blank"
      rel="noreferrer"
      className="text-primary underline underline-offset-2 hover:text-primary/80"
    >
      {children}
    </a>
  ),
  code: ({ className, children, ...props }: any) => (
    <code
      {...props}
      className={cn(
        'rounded bg-surface-container-highest/50 px-1.5 py-0.5 font-mono text-[0.9em] text-on-surface break-all',
        className,
      )}
    >
      {children}
    </code>
  ),
  pre: ({ children }: any) => {
    const first = Array.isArray(children) ? children[0] : children
    if (isValidElement(first)) {
      const props = first.props as { className?: unknown; children?: unknown }
      const className = typeof props.className === 'string' ? props.className : ''
      const match = /language-([a-z0-9_-]+)/i.exec(className)
      const language = match?.[1]

      const raw = Array.isArray(props.children)
        ? props.children.map((c) => String(c ?? '')).join('')
        : String(props.children ?? '')
      const text = raw.endsWith('\n') ? raw.slice(0, -1) : raw

      return (
        <CodeBlock language={language} code={text}>
          <ShikiCode code={text} language={language} className="max-h-[600px]" />
        </CodeBlock>
      )
    }

    return (
      <pre className="my-3 overflow-auto rounded-xl border border-outline-variant bg-surface-container-low p-4 text-sm shadow-sm">
        {children}
      </pre>
    )
  },
  blockquote: ({ children }: any) => (
    <blockquote className="border-l-4 border-primary/50 pl-4 py-1 my-2 text-muted-foreground bg-surface-container-highest/20 rounded-r-lg">
      {children}
    </blockquote>
  ),
  hr: () => <div className="my-4 h-px bg-outline-variant" />,
}

export const ChatMarkdown = memo(function ChatMarkdown({ markdown }: { markdown: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkBreaks]}
      components={markdownComponents}
    >
      {markdown}
    </ReactMarkdown>
  )
})

