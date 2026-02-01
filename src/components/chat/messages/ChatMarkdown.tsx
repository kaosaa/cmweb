import { isValidElement } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkBreaks from 'remark-breaks'
import remarkGfm from 'remark-gfm'
import { cn } from '@/lib/utils'
import { ShikiCode } from '@/components/ShikiCode'

export function ChatMarkdown({ markdown }: { markdown: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkBreaks]}
      components={{
        p: ({ children }) => <p className="whitespace-pre-wrap leading-7 mb-2 last:mb-0">{children}</p>,
        h1: ({ children }) => <h1 className="text-xl font-bold leading-tight mt-4 mb-2">{children}</h1>,
        h2: ({ children }) => <h2 className="text-lg font-bold leading-tight mt-4 mb-2">{children}</h2>,
        h3: ({ children }) => <h3 className="text-base font-semibold leading-tight mt-3 mb-1">{children}</h3>,
        ul: ({ children }) => <ul className="ml-5 list-disc space-y-1 mb-2">{children}</ul>,
        ol: ({ children }) => <ol className="ml-5 list-decimal space-y-1 mb-2">{children}</ol>,
        li: ({ children }) => <li className="leading-7">{children}</li>,
        a: ({ href, children }) => (
          <a
            href={href ?? '#'}
            target="_blank"
            rel="noreferrer"
            className="text-primary underline underline-offset-2 hover:text-primary/80"
          >
            {children}
          </a>
        ),
        code: ({ className, children, ...props }) => (
          <code
            {...props}
            className={cn(
              'rounded bg-surface-container-highest/50 px-1.5 py-0.5 font-mono text-[0.9em] text-on-surface',
              className,
            )}
          >
            {children}
          </code>
        ),
        pre: ({ children }) => {
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
              <div className="my-3 overflow-hidden rounded-xl border border-outline-variant bg-surface-container-low shadow-sm">
                <ShikiCode code={text} language={language} className="max-h-[480px] text-sm" />
              </div>
            )
          }

          return (
            <pre className="my-3 overflow-auto rounded-xl border border-outline-variant bg-surface-container-low p-4 text-xs shadow-sm">
              {children}
            </pre>
          )
        },
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-primary/50 pl-4 py-1 my-2 text-muted-foreground bg-surface-container-highest/20 rounded-r-lg">
            {children}
          </blockquote>
        ),
        hr: () => <div className="my-4 h-px bg-outline-variant" />,
      }}
    >
      {markdown}
    </ReactMarkdown>
  )
}

