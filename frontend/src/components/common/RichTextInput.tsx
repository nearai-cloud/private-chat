import React, { useEffect, useRef, useImperativeHandle } from 'react';
import { marked } from 'marked';
import TurndownService from 'turndown';
import { Editor } from '@tiptap/core';
import { EditorState, TextSelection } from 'prosemirror-state';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import Placeholder from '@tiptap/extension-placeholder';
import Highlight from '@tiptap/extension-highlight';
import Typography from '@tiptap/extension-typography';
import StarterKit from '@tiptap/starter-kit';
import { all, createLowlight } from 'lowlight';

// create a lowlight instance with all languages loaded
const lowlight = createLowlight(all);

const turndownService = new TurndownService({
  codeBlockStyle: 'fenced',
  headingStyle: 'atx'
});
turndownService.escape = (string) => string;

interface RichTextInputProps {
  className?: string;
  placeholder?: string;
  value?: string;
  id?: string;
  raw?: boolean;
  preserveBreaks?: boolean;
  messageInput?: boolean;
  shiftEnter?: boolean;
  onUpdate?: (value: string) => void;
  onFocus?: (event: FocusEvent) => void;
  onKeyUp?: (event: KeyboardEvent) => void;
  onKeyDown?: (event: KeyboardEvent) => void;
  onPaste?: (event: ClipboardEvent) => void;
  onCompositionStart?: (event: CompositionEvent) => void;
  onCompositionEnd?: (event: CompositionEvent) => void;
}

export interface RichTextInputRef {
  setContent: (content: string) => void;
  getEditor: () => Editor | null;
}

const RichTextInput = React.forwardRef<RichTextInputRef, RichTextInputProps>(({
  className = 'input-prose',
  placeholder = 'Type here...',
  value = '',
  id = '',
  raw = false,
  preserveBreaks = false,
  messageInput = false,
  shiftEnter = false,
  onUpdate,
  onFocus,
  onKeyUp,
  onKeyDown,
  onPaste,
  onCompositionStart,
  onCompositionEnd
}, ref) => {
  const elementRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<Editor | null>(null);

  useImperativeHandle(ref, () => ({
    setContent: (content: string) => {
      if (editorRef.current) {
        editorRef.current.commands.setContent(content);
      }
    },
    getEditor: () => editorRef.current
  }));

  // Function to find the next template in the document
  const findNextTemplate = (doc: any, from = 0) => {
    const patterns = [{ start: '{{', end: '}}' }];
    let result = null;

    doc.nodesBetween(from, doc.content.size, (node: any, pos: number) => {
      if (result) return false;
      if (node.isText) {
        const text = node.text;
        let index = Math.max(0, from - pos);
        while (index < text.length) {
          for (const pattern of patterns) {
            if (text.startsWith(pattern.start, index)) {
              const endIndex = text.indexOf(pattern.end, index + pattern.start.length);
              if (endIndex !== -1) {
                result = {
                  from: pos + index,
                  to: pos + endIndex + pattern.end.length
                };
                return false;
              }
            }
          }
          index++;
        }
      }
    });

    return result;
  };

  // Function to select the next template in the document
  const selectNextTemplate = (state: any, dispatch: any) => {
    const { doc, selection } = state;
    const from = selection.to;
    let template = findNextTemplate(doc, from);

    if (!template) {
      template = findNextTemplate(doc, 0);
    }

    if (template) {
      if (dispatch) {
        const tr = state.tr.setSelection(TextSelection.create(doc, template.from, template.to));
        dispatch(tr);
      }
      return true;
    }
    return false;
  };

  const selectTemplate = () => {
    if (value !== '' && editorRef.current) {
      setTimeout(() => {
        const editor = editorRef.current!;
        const templateFound = selectNextTemplate(editor.view.state, editor.view.dispatch);
        if (!templateFound) {
          const endPos = editor.view.state.doc.content.size;
          editor.view.dispatch(
            editor.view.state.tr.setSelection(TextSelection.create(editor.view.state.doc, endPos))
          );
        }
      }, 0);
    }
  };

  useEffect(() => {
    if (!elementRef.current) return;

    const initializeEditor = async () => {
      if (preserveBreaks) {
        turndownService.addRule('preserveBreaks', {
          filter: 'br',
          replacement: function (content) {
            return '<br/>';
          }
        });
      }

      let content = value;

      if (!raw) {
        const tryParse = async (value: string, attempts = 3, interval = 100): Promise<string> => {
          try {
            return marked.parse(value.replaceAll(`\n<br/>`, `<br/>`), {
              breaks: false
            }) as string;
          } catch (error) {
            if (attempts <= 1) {
              return value;
            }
            await new Promise((resolve) => setTimeout(resolve, interval));
            return tryParse(value, attempts - 1, interval);
          }
        };

        content = await tryParse(value);
      }

      const editor = new Editor({
        element: elementRef.current!,
        extensions: [
          StarterKit,
          CodeBlockLowlight.configure({
            lowlight
          }),
          Highlight,
          Typography,
          Placeholder.configure({ placeholder }),
        ],
        content: content,
        autofocus: messageInput ? true : false,
        onTransaction: () => {
          if (!raw) {
            let newValue = turndownService
              .turndown(
                editor
                  .getHTML()
                  .replace(/<p><\/p>/g, '<br/>')
                  .replace(/ {2,}/g, (m) => m.replace(/ /g, '\u00a0'))
              )
              .replace(/\u00a0/g, ' ');

            if (!preserveBreaks) {
              newValue = newValue.replace(/<br\/>/g, '');
            }

            if (value !== newValue && onUpdate) {
              onUpdate(newValue);

              if (editor.isActive('paragraph')) {
                if (newValue === '') {
                  editor.commands.clearContent();
                }
              }
            }
          } else {
            const htmlValue = editor.getHTML();
            if (onUpdate) {
              onUpdate(htmlValue);
            }
          }
        },
        editorProps: {
          attributes: { id },
          handleDOMEvents: {
            compositionstart: (view, event) => {
              onCompositionStart?.(event);
              return false;
            },
            compositionend: (view, event) => {
              onCompositionEnd?.(event);
              return false;
            },
            focus: (view, event) => {
              onFocus?.(event);
              return false;
            },
            keyup: (view, event) => {
              onKeyUp?.(event);
              return false;
            },
            keydown: (view, event) => {
              if (messageInput) {
                // Handle Tab Key
                if (event.key === 'Tab') {
                  const handled = selectNextTemplate(view.state, view.dispatch);
                  if (handled) {
                    event.preventDefault();
                    return true;
                  }
                }

                if (event.key === 'Enter') {
                  const { state } = view;
                  const { $head } = state.selection;

                  function isInside(nodeTypes: string[]): boolean {
                    let currentNode = $head;
                    while (currentNode) {
                      if (nodeTypes.includes(currentNode.parent.type.name)) {
                        return true;
                      }
                      if (!currentNode.depth) break;
                      currentNode = state.doc.resolve(currentNode.before());
                    }
                    return false;
                  }

                  const isInCodeBlock = isInside(['codeBlock']);
                  const isInList = isInside(['listItem', 'bulletList', 'orderedList']);
                  const isInHeading = isInside(['heading']);

                  if (isInCodeBlock || isInList || isInHeading) {
                    return false;
                  }
                }

                // Handle shift + Enter for a line break
                if (shiftEnter) {
                  if (event.key === 'Enter' && event.shiftKey && !event.ctrlKey && !event.metaKey) {
                    editor.commands.setHardBreak();
                    view.dispatch(view.state.tr.scrollIntoView());
                    event.preventDefault();
                    return true;
                  }
                }
              }
              onKeyDown?.(event);
              return false;
            },
            paste: (view, event) => {
              if (event.clipboardData) {
                const plainText = event.clipboardData.getData('text/plain');
                if (plainText) {
                  return false;
                }

                const hasImageFile = Array.from(event.clipboardData.files).some((file) =>
                  file.type.startsWith('image/')
                );

                const hasImageItem = Array.from(event.clipboardData.items).some((item) =>
                  item.type.startsWith('image/')
                );

                if (hasImageFile || hasImageItem) {
                  onPaste?.(event);
                  event.preventDefault();
                  return true;
                }
              }

              view.dispatch(view.state.tr.scrollIntoView());
              return false;
            }
          }
        }
      });

      editorRef.current = editor;

      if (messageInput) {
        selectTemplate();
      }
    };

    initializeEditor();

    return () => {
      if (editorRef.current) {
        editorRef.current.destroy();
        editorRef.current = null;
      }
    };
  }, []);

  // Update the editor content if the external `value` changes
  useEffect(() => {
    if (editorRef.current && value !== undefined) {
      const editor = editorRef.current;
      const currentContent = raw
        ? editor.getHTML()
        : turndownService
            .turndown(
              (preserveBreaks
                ? editor.getHTML().replace(/<p><\/p>/g, '<br/>')
                : editor.getHTML()
              ).replace(/ {2,}/g, (m) => m.replace(/ /g, '\u00a0'))
            )
            .replace(/\u00a0/g, ' ');

      if (value !== currentContent) {
        if (raw) {
          editor.commands.setContent(value);
        } else {
          const content = preserveBreaks
            ? value
            : marked.parse(value.replaceAll(`\n<br/>`, `<br/>`), {
                breaks: false
              }) as string;
          editor.commands.setContent(content);
        }
        selectTemplate();
      }
    }
  }, [value, raw, preserveBreaks]);

  return <div ref={elementRef} className={`relative w-full min-w-full h-full min-h-fit ${className}`} />;
});

RichTextInput.displayName = 'RichTextInput';

export default RichTextInput;