import { useEffect, useRef } from 'react'
import { basicSetup } from 'codemirror'
import { EditorView, keymap } from '@codemirror/view'
import { Compartment, EditorState, Prec } from '@codemirror/state'
import { indentWithTab } from '@codemirror/commands'
import { sql } from '@codemirror/lang-sql'
import { python } from '@codemirror/lang-python'
import { javascript } from '@codemirror/lang-javascript'
import { oneDark } from '@codemirror/theme-one-dark'

export type EditorLanguage = 'sql' | 'python' | 'javascript'

const langExt = (l: EditorLanguage) =>
  l === 'sql' ? sql() : l === 'python' ? python() : javascript()

interface Props {
  value: string
  onChange: (value: string) => void
  language: EditorLanguage
  fontSize?: number
  fontFamily?: string
  dark?: boolean
  /** Ctrl/Cmd+Enter */
  onRun?: () => void
}

export function CodeEditor({ value, onChange, language, fontSize = 14, fontFamily, dark = false, onRun }: Props) {
  const host = useRef<HTMLDivElement>(null)
  const view = useRef<EditorView | null>(null)
  const onChangeRef = useRef(onChange)
  const onRunRef = useRef(onRun)
  useEffect(() => {
    onChangeRef.current = onChange
    onRunRef.current = onRun
  })
  const lang = useRef(new Compartment())
  const look = useRef(new Compartment())

  const lookExt = () => [
    EditorView.theme({
      '&': { height: '100%', fontSize: `${fontSize}px` },
      '.cm-scroller': { fontFamily: fontFamily ?? 'ui-monospace, monospace' },
    }),
    dark ? oneDark : EditorView.theme({ '&': { backgroundColor: '#fff', color: '#0f172a' } }, { dark: false }),
  ]

  useEffect(() => {
    const v = new EditorView({
      parent: host.current!,
      state: EditorState.create({
        doc: value,
        extensions: [
          basicSetup,
          keymap.of([indentWithTab]),
          Prec.highest(keymap.of([{ key: 'Mod-Enter', run: () => {
                  if (!onRunRef.current) return false
                  onRunRef.current()
                  return true
                } }])),
          EditorView.contentAttributes.of({ 'aria-label': 'Code' }),
          lang.current.of(langExt(language)),
          look.current.of(lookExt()),
          EditorView.updateListener.of((u) => {
            if (u.docChanged) onChangeRef.current(u.state.doc.toString())
          }),
        ],
      }),
    })
    view.current = v
    return () => v.destroy()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    view.current?.dispatch({ effects: lang.current.reconfigure(langExt(language)) })
  }, [language])

  useEffect(() => {
    view.current?.dispatch({ effects: look.current.reconfigure(lookExt()) })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fontSize, fontFamily, dark])

  useEffect(() => {
    const v = view.current
    if (v && v.state.doc.toString() !== value) {
      v.dispatch({ changes: { from: 0, to: v.state.doc.length, insert: value } })
    }
  }, [value])

  return <div ref={host} className="h-full overflow-hidden" data-testid="code-editor" />
}
