'use client';

import * as React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { 
    Bold, 
    Italic, 
    List, 
    ListOrdered, 
    Undo, 
    Redo 
} from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
    value: string;
    onChangeAction: (value: string) => void;
    placeholder?: string;
    minHeight?: string;
    disabled?: boolean;
}

export function RichTextEditor({ 
    value, 
    onChangeAction, 
    placeholder = 'Start typing...',
    minHeight = '150px',
    disabled = false
}: RichTextEditorProps) {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Placeholder.configure({
                placeholder,
            }),
        ],
        content: value,
        editable: !disabled,
        onUpdate: ({ editor }) => {
            onChangeAction(editor.getHTML());
        },
        immediatelyRender: false,
    });

    // Update editable state if disabled prop changes
    React.useEffect(() => {
        if (editor) {
            editor.setEditable(!disabled);
        }
    }, [editor, disabled]);

    // Update content if value changes externally
    React.useEffect(() => {
        if (editor && value !== editor.getHTML()) {
            editor.commands.setContent(value);
        }
    }, [editor, value]);

    if (!editor) return null;

    return (
        <div className={cn(
            "border rounded-md focus-within:ring-1 focus-within:ring-ring overflow-hidden transition-colors",
            disabled ? "border-none bg-transparent" : "bg-muted/30 border-muted"
        )}>
            {/* Toolbar */}
            {!disabled && (
                <div className="bg-muted/50 border-b p-1 flex flex-wrap gap-1">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className={cn("h-8 w-8 p-0", editor.isActive('bold') && "bg-muted-foreground/20")}
                        onClick={() => editor.chain().focus().toggleBold().run()}
                    >
                        <Bold className="h-4 w-4" />
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className={cn("h-8 w-8 p-0", editor.isActive('italic') && "bg-muted-foreground/20")}
                        onClick={() => editor.chain().focus().toggleItalic().run()}
                    >
                        <Italic className="h-4 w-4" />
                    </Button>
                    <div className="w-[1px] bg-border mx-1 my-1" />
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className={cn("h-8 w-8 p-0", editor.isActive('bulletList') && "bg-muted-foreground/20")}
                        onClick={() => editor.chain().focus().toggleBulletList().run()}
                    >
                        <List className="h-4 w-4" />
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className={cn("h-8 w-8 p-0", editor.isActive('orderedList') && "bg-muted-foreground/20")}
                        onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    >
                        <ListOrdered className="h-4 w-4" />
                    </Button>
                    <div className="ml-auto flex gap-1">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => editor.chain().focus().undo().run()}
                        >
                            <Undo className="h-4 w-4" />
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => editor.chain().focus().redo().run()}
                        >
                            <Redo className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Editor Area */}
            <EditorContent 
                editor={editor} 
                className={cn(
                    "prose prose-sm max-w-none focus:outline-none overflow-y-auto",
                    !disabled ? "p-3 [&_.ProseMirror]:min-h-[150px]" : "p-0",
                    "[&_.ProseMirror]:outline-none",
                    "[&_ul]:list-disc [&_ul]:ml-4 [&_ol]:list-decimal [&_ol]:ml-4"
                )}
                style={{ minHeight: disabled ? 'auto' : minHeight }}
            />
        </div>
    );
}
