import { useRef, useState, useEffect } from "react";
import Editor, { Monaco, OnMount } from "@monaco-editor/react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/theme-provider";
import { Moon, Sun } from "lucide-react";

interface JsonEditorProps {
  initialValue: string;
  onChange?: (value: string) => void;
  onValidate?: (isValid: boolean) => void;
  schema?: z.ZodType<any>;
  height?: string;
  className?: string;
  readOnly?: boolean;
}

export default function JsonEditor({
  initialValue,
  onChange,
  onValidate,
  schema,
  height = "500px",
  className,
  readOnly = false,
}: JsonEditorProps) {
  const [, setEditorContent] = useState<string>(initialValue); // Only using the setter
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const { theme } = useTheme();
  
  // Track if editor is in dark mode
  const [isDarkTheme, setIsDarkTheme] = useState(theme === 'dark' || 
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches));
  
  const validateJson = (value: string) => {
    try {
      const parsed = JSON.parse(value);
      
      if (schema) {
        const result = schema.safeParse(parsed);
        if (onValidate) {
          onValidate(result.success);
        }
        return result.success;
      } else {
        if (onValidate) {
          onValidate(true);
        }
        return true;
      }
    } catch (e) {
      if (onValidate) {
        onValidate(false);
      }
      return false;
    }
  };
  
  const handleEditorChange = (value: string | undefined) => {
    const newValue = value || "";
    setEditorContent(newValue);
    
    if (onChange) {
      onChange(newValue);
    }
    
    validateJson(newValue);
  };
  
  // Effect to update editor theme when app theme changes
  useEffect(() => {
    const isDark = theme === 'dark' || 
      (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setIsDarkTheme(isDark);
    
    // Update Monaco theme if editor is already mounted
    if (monacoRef.current && editorRef.current) {
      monacoRef.current.editor.setTheme(isDark ? 'vs-dark' : 'vs-light');
    }
  }, [theme]);
  
  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    
    // Set editor theme based on current app theme
    monaco.editor.setTheme(isDarkTheme ? 'vs-dark' : 'vs-light');
    
    // Set editor options
    editor.updateOptions({
      minimap: {
        enabled: false,
      },
      scrollBeyondLastLine: false,
      folding: true,
      lineNumbers: "on",
      renderLineHighlight: "all",
      readOnly,
      scrollbar: {
        verticalScrollbarSize: 10,
        horizontalScrollbarSize: 10,
      },
    });
    
    // Configure JSON language features
    monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
      validate: true,
      allowComments: true,
      schemas: [],
      enableSchemaRequest: true,
    });
    
    // Initial validation
    validateJson(initialValue);
  };
  
  const formatDocument = () => {
    if (editorRef.current) {
      editorRef.current.getAction("editor.action.formatDocument").run();
    }
  };
  
  // Toggle editor theme manually
  const toggleEditorTheme = () => {
    if (monacoRef.current && editorRef.current) {
      const newTheme = !isDarkTheme;
      setIsDarkTheme(newTheme);
      monacoRef.current.editor.setTheme(newTheme ? 'vs-dark' : 'vs-light');
    }
  };

  return (
    <div className={cn("border rounded-md", className)}>
      <div className="flex items-center justify-end p-2 bg-muted border-b">
        <button
          onClick={toggleEditorTheme}
          className="p-1 rounded-md hover:bg-accent transition-colors" 
          title={isDarkTheme ? "Switch to light theme" : "Switch to dark theme"}
        >
          {isDarkTheme ? 
            <Sun className="h-4 w-4" /> : 
            <Moon className="h-4 w-4" />}
        </button>
      </div>
      <Editor
        height={height}
        defaultLanguage="json"
        defaultValue={initialValue}
        onChange={handleEditorChange}
        onMount={handleEditorDidMount}
        options={{
          readOnly,
          automaticLayout: true,
          formatOnPaste: true,
          formatOnType: true,
        }}
        theme={isDarkTheme ? 'vs-dark' : 'vs-light'}
      />
      {!readOnly && (
        <div className="flex justify-end p-2 bg-muted border-t">
          <button
            onClick={formatDocument}
            className="px-3 py-1 text-xs rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80"
          >
            Format
          </button>
        </div>
      )}
    </div>
  );
}
