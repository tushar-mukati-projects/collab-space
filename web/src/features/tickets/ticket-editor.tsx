"use client";

import * as React from "react";
import { BlockNoteEditor, createExtension } from "@blocknote/core";
import { SuggestionMenu } from "@blocknote/core/extensions";
import { FilePanelController, SuggestionMenuController } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/shadcn";
import "@blocknote/shadcn/style.css";

const suggestionMenuKeys = createExtension(({ editor }) => ({
  key: "suggestion-menu-keys" as const,
  keyboardShortcuts: {
    ArrowDown: () => !!editor.getExtension(SuggestionMenu)?.shown(),
    ArrowUp: () => !!editor.getExtension(SuggestionMenu)?.shown(),
    Enter: () => !!editor.getExtension(SuggestionMenu)?.shown(),
    Escape: () => !!editor.getExtension(SuggestionMenu)?.shown(),
  },
}));

interface CollaborationConfig {
  documentName: string;
  user: { name: string; color: string };
  token: string;
}

interface TicketEditorProps {
  initialContent: string;
  onChange: (markdown: string) => void;
  className?: string;
  mentionUsers?: { id: string; name: string }[];
  collaboration?: CollaborationConfig;
}

const uploadFile = async (file: File): Promise<string> => {
  return URL.createObjectURL(file);
};

const CURSOR_COLORS = [
  "#6366f1",
  "#f43f5e",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#0ea5e9",
  "#ec4899",
  "#14b8a6",
];

export const getCollabColor = (userId: string): string => {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash << 5) - hash + userId.charCodeAt(i);
    hash |= 0;
  }
  return CURSOR_COLORS[Math.abs(hash) % CURSOR_COLORS.length];
};

export const TicketEditor = ({
  initialContent,
  onChange,
  className = "bn-ticket-editor",
  mentionUsers = [],
  collaboration,
}: TicketEditorProps) => {
  const [editor, setEditor] = React.useState<BlockNoteEditor | null>(null);
  const providerRef = React.useRef<{ destroy: () => void } | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      if (collaboration) {
        const Y = await import("yjs");
        const { HocuspocusProvider } = await import("@hocuspocus/provider");
        const doc = new Y.Doc();

        const provider = new HocuspocusProvider({
          url: process.env.NEXT_PUBLIC_COLLAB_URL!,
          name: collaboration.documentName,
          document: doc,
          token: collaboration.token,
        });
        providerRef.current = provider;

        const ed = BlockNoteEditor.create({
          uploadFile,
          extensions: [suggestionMenuKeys()],
          collaboration: {
            provider: provider as never,
            fragment: doc.getXmlFragment("document-store"),
            user: collaboration.user,
            showCursorLabels: "activity",
          },
        });
        if (!cancelled) setEditor(ed);
      } else {
        const ed = BlockNoteEditor.create({ uploadFile, extensions: [suggestionMenuKeys()] });
        if (initialContent) {
          const blocks = await ed.tryParseMarkdownToBlocks(initialContent);
          if (!cancelled) ed.replaceBlocks(ed.document, blocks);
        }
        if (!cancelled) setEditor(ed);
      }
    })();

    return () => {
      cancelled = true;
      providerRef.current?.destroy();
      providerRef.current = null;
    };
  }, [collaboration, initialContent]);

  const onChangeRef = React.useRef(onChange);
  onChangeRef.current = onChange;

  React.useEffect(() => {
    if (!editor) return;
    return editor.onChange(async () => {
      const md = await editor.blocksToMarkdownLossy(editor.document);
      onChangeRef.current(md);
    });
  }, [editor]);

  const [isDark, setIsDark] = React.useState(false);
  React.useEffect(() => {
    const check = () => setIsDark(document.documentElement.classList.contains("dark"));
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const mentionItems = React.useMemo(
    () => mentionUsers.map((u) => ({ id: u.id, name: u.name })),
    [mentionUsers],
  );

  const handleMentionSelect = React.useCallback(
    (item: { id: string; name: string }) => {
      if (!editor) return;
      editor.insertInlineContent([
        { type: "text", text: `@${item.name}`, styles: { bold: true } },
        { type: "text", text: " ", styles: {} },
      ]);
    },
    [editor],
  );

  if (!editor) return null;

  return (
    <div className={className}>
      <BlockNoteView
        editor={editor}
        theme={isDark ? "dark" : "light"}
        slashMenu={false}
        filePanel={false}
      >
        <SuggestionMenuController
          triggerCharacter="/"
          floatingUIOptions={{ useFloatingOptions: { strategy: "fixed" } }}
        />
        <SuggestionMenuController
          triggerCharacter="@"
          getItems={async (query) =>
            mentionItems
              .filter((item) => item.name.toLowerCase().includes(query.toLowerCase()))
              .map((item) => ({
                key: item.id,
                title: item.name,
                onItemClick: () => handleMentionSelect(item),
              }))
          }
          floatingUIOptions={{ useFloatingOptions: { strategy: "fixed" } }}
        />
        <FilePanelController floatingUIOptions={{ useFloatingOptions: { strategy: "fixed" } }} />
      </BlockNoteView>
    </div>
  );
};
