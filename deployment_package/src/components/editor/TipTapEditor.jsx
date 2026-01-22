'use client'

import { useEffect, useState } from 'react'

import { useEditor, EditorContent } from '@tiptap/react'
import { StarterKit } from '@tiptap/starter-kit'
import { Underline } from '@tiptap/extension-underline'
import { TextAlign } from '@tiptap/extension-text-align'
import { Placeholder } from '@tiptap/extension-placeholder'
import { Color } from '@tiptap/extension-color'
import { TextStyle } from '@tiptap/extension-text-style'
import { Link } from '@tiptap/extension-link'
import { Image } from '@tiptap/extension-image'
import { Table, TableCell, TableHeader, TableRow } from '@tiptap/extension-table'
import { Typography } from '@mui/material'
import CircularProgress from '@mui/material/CircularProgress'

/**
 * @typedef {Object} TipTapEditorProps
 * @property {string} [initialContent] - The initial content of the editor
 * @property {function(string): void} [onUpdate] - Callback when content changes
 * @property {string} [className] - Additional CSS class names
 * @property {string} [placeholder] - Placeholder text
 * @property {boolean} [editable] - Whether the editor is editable
 */

/**
 * @param {TipTapEditorProps} props - The component props
 */
const TipTapEditor = ({
  initialContent = '',
  onUpdate,
  className = '',
  placeholder = 'Start writing...',
  editable = true
}) => {
  const [mounted, setMounted] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] }
      }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph', 'image'] }),
      Placeholder.configure({
        placeholder: ({ node }) => (node?.type?.name === 'heading' ? 'Heading' : placeholder)
      }),
      TextStyle,
      Color,
      Link.configure({ openOnClick: false, linkOnPaste: true }),
      Image,
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell
    ],
    editorProps: {
      attributes: {
        class: `prose max-w-none focus:outline-none min-h-[200px] p-4 ${className}`,
        'data-testid': 'tiptap-editor'
      }
    },
    immediatelyRender: false,
    autofocus: false,
    editable: mounted && editable,
    injectCSS: true,
    content: mounted ? initialContent : null,
    enableCoreExtensions: mounted,
    enableInputRules: mounted,
    enablePasteRules: mounted
  })

  // Handle updates
  useEffect(() => {
    if (!editor || !onUpdate) return

    const handleUpdate = ({ editor: editorInstance }) => {
      try {
        const html = editorInstance.getHTML()

        onUpdate(html)
      } catch (error) {
        console.error('Error in editor update handler:', error)
      }
    }

    editor.on('update', handleUpdate)

    return () => {
      editor.off('update', handleUpdate)
    }
  }, [editor, onUpdate])

  // Update content when initialContent changes
  useEffect(() => {
    if (!editor || !mounted || !initialContent) return

    try {
      if (editor.isDestroyed || editor.getHTML() === initialContent) return

      const timer = setTimeout(() => {
        try {
          if (!editor.isDestroyed && editor.isEditable && editor.commands?.setContent) {
            editor.commands.setContent(initialContent, false)
          }
        } catch (error) {
          console.error('Error in setContent:', error)
        }
      }, 100)

      return () => clearTimeout(timer)
    } catch (error) {
      console.error('Error setting editor content:', error)
    }
  }, [initialContent, editor, mounted])

  // Set mounted state and handle editor focus
  useEffect(() => {
    setMounted(true)

    return () => {
      if (editor && !editor.isDestroyed) {
        editor.destroy()
      }

      setMounted(false)
    }
  }, [editor])

  if (!mounted || !editor) {
    return (
      <div className={`border rounded-lg border-gray-300 min-h-[200px] flex items-center justify-center ${className}`}>
        <div className='flex items-center space-x-2'>
          <CircularProgress size={24} />
          <Typography variant='body2' color='textSecondary'>
            Loading editor...
          </Typography>
        </div>
      </div>
    )
  }

  return (
    <div className={`border rounded-lg border-gray-300 overflow-hidden ${!editable ? 'bg-gray-50' : ''}`}>
      <EditorContent editor={editor} className={editable ? 'min-h-[200px]' : ''} />
    </div>
  )
  console.log('Editor commands:', editor?.commands)
}

export default TipTapEditor
