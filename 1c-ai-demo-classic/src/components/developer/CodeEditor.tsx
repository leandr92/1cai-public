/**
 * Редактор кода для 1C:Enterprise с автодополнением
 * Monaco Editor с интеграцией 1С BSL
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  Code, 
  Save, 
  Download, 
  Upload, 
  Play, 
  Square, 
  RotateCcw, 
  Settings, 
  Eye, 
  EyeOff,
  Search,
  Replace,
  FileText,
  FolderOpen,
  Folder,
  ChevronLeft,
  ChevronRight,
  GitBranch,
  GitPullRequest,
  AlertCircle,
  CheckCircle,
  Clock,
  Zap,
  BookOpen,
  HelpCircle,
  Maximize,
  Minimize,
  Copy,
  Clipboard,
  Lightbulb,
  Brain,
  Target,
  Layers,
  Palette
} from 'lucide-react';

// Импорт Monaco Editor (динамический импорт для улучшения производительности)
let MonacoEditor: any = null;

interface CodeEditorProps {
  value: string;
  onChange?: (value: string) => void;
  onSave?: (value: string) => void;
  onExecute?: (code: string) => void;
  language?: 'bsl' | 'javascript' | 'typescript' | 'json' | 'xml';
  theme?: 'light' | 'dark' | '1c';
  readonly?: boolean;
  showMinimap?: boolean;
  showLineNumbers?: boolean;
  showWhitespace?: boolean;
  showIndentGuides?: boolean;
  wordWrap?: 'off' | 'on' | 'wordWrapColumn' | 'bounded';
  fontSize?: number;
  fontFamily?: string;
  tabSize?: number;
  insertSpaces?: boolean;
  autoSave?: boolean;
  autoFormat?: boolean;
  autoComplete?: boolean;
  showAutocomplete?: boolean;
  height?: string | number;
  width?: string | number;
  className?: string;
  placeholder?: string;
  validationErrors?: ValidationError[];
  warnings?: ValidationWarning[];
  suggestions?: CodeSuggestion[];
  onValidation?: (result: CodeAnalysisResult) => void;
  onSignatureHelp?: (help: SignatureHelp) => void;
  onHover?: (info: HoverInfo) => void;
}

interface ValidationError {
  message: string;
  severity: 'error' | 'warning' | 'info';
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
  source?: string;
  code?: string | number;
}

interface ValidationWarning extends Omit<ValidationError, 'severity'> {
  severity: 'warning' | 'info';
  rule?: string;
  suggestion?: string;
}

interface CodeSuggestion {
  kind: 'refactor' | 'quickfix' | 'action' | 'diagnostic';
  title: string;
  description: string;
  action: string;
  changes?: TextEdit[];
  diagnostics?: ValidationError[];
}

interface TextEdit {
  range: {
    startLine: number;
    startColumn: number;
    endLine: number;
    endColumn: number;
  };
  newText: string;
}

import { codeAutocompleteService } from '../../services/code-autocomplete-service';

// Type definitions
interface CodeContext {
  document: string;
  position: { line: number; character: number };
  languageId: string;
  fileName: string;
  currentLine: string;
  lines: string[];
  beforeCursor: string;
  afterCursor: string;
  scope: {
    variables: any[];
    functions: any[];
    procedures: any[];
    classes: any[];
    objects: any[];
    modules: any[];
  };
}

interface MonacoCompletionItem {
  label: string;
  kind: any;
  insertText: string;
  insertTextRules?: any;
  documentation?: string;
  detail?: string;
  sortText?: string;
  filterText?: string;
}

type CodeAnalysisResult = any;
type SignatureHelp = any;
type HoverInfo = any;

const CodeEditor: React.FC<CodeEditorProps> = ({
  value,
  onChange,
  onSave,
  onExecute,
  language = 'bsl',
  theme = '1c',
  readonly = false,
  showMinimap = true,
  showLineNumbers = true,
  showWhitespace = false,
  showIndentGuides = true,
  wordWrap = 'off',
  fontSize = 14,
  fontFamily = 'Monaco, Menlo, "Ubuntu Mono", Consolas, "Source Code Pro", monospace',
  tabSize = 4,
  insertSpaces = true,
  autoSave = false,
  autoFormat = true,
  autoComplete = true,
  showAutocomplete = true,
  height = '400px',
  width = '100%',
  className = '',
  placeholder = 'Начните писать код 1С...',
  validationErrors = [],
  warnings = [],
  suggestions = [],
  onValidation,
  onSignatureHelp,
  onHover,
  ...props
}) => {
  // Состояние редактора
  const [editor, setEditor] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showOutline, setShowOutline] = useState(false);
  const [currentTheme, setCurrentTheme] = useState(theme);

  // Состояние поиска
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);

  // Состояние автодополнения
  const [autocompleteEnabled, setAutocompleteEnabled] = useState(autoComplete);
  const [completionItems, setCompletionItems] = useState<MonacoCompletionItem[]>([]);
  const [isAutocompleteVisible, setIsAutocompleteVisible] = useState(false);

  // Рефы
  const editorRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const monacoRef = useRef<any>(null);

  // Мемоизированные конфигурации Monaco
  const monacoOptions = useMemo(() => ({
    value,
    language: language === 'bsl' ? 'plaintext' : language, // Monaco не поддерживает BSL напрямую
    theme: getMonacoTheme(currentTheme),
    readOnly: readonly,
    minimap: { enabled: showMinimap },
    lineNumbers: showLineNumbers ? 'on' as const : 'off' as const,
    renderWhitespace: (showWhitespace ? 'all' : 'none') as 'none' | 'boundary' | 'selection' | 'all' | 'trailing',
    renderIndentGuides: showIndentGuides,
    wordWrap: wordWrap as 'off' | 'on' | 'wordWrapColumn' | 'bounded',
    fontSize,
    fontFamily,
    tabSize,
    insertSpaces,
    automaticLayout: true,
    scrollBeyondLastLine: false,
    contextmenu: true,
    mouseWheelZoom: true,
    multiCursorModifier: 'ctrlCmd' as const,
    folding: true,
    foldingStrategy: 'indentation' as const,
    showFoldingControls: 'always' as const,
    bracketPairColorization: { enabled: true },
    guides: {
      bracketPairs: true,
      indentation: true,
      highlightActiveBracketPair: true,
      highlightActiveIndentGuide: true
    },
    suggest: {
      enabled: autocompleteEnabled,
      showKeywords: true,
      showSnippets: true,
      showFunctions: true,
      showConstructors: true,
      showFields: true,
      showVariables: true,
      showClasses: true,
      showInterfaces: true,
      showModules: true,
      showProperties: true,
      showEvents: true,
      showOperators: true,
      showUnits: true,
      showValues: true,
      showConstants: true,
      showEnums: true,
      showEnumMembers: true,
      showTypes: true
    },
    quickSuggestions: {
      other: true,
      comments: true,
      strings: true
    },
    parameterHints: {
      enabled: true,
      cycle: true
    },
    hover: {
      enabled: true,
      delay: 300,
      sticky: true
    },
    lightbulb: {
      enabled: true
    },
    referenceSearch: {
      enabled: true
    },
    definitionLinkOpensInPeek: false,
    gotoLocation: {
      multipleReferences: 'peek' as const,
      multipleDefinitions: 'peek' as const,
      multipleDeclarations: 'peek' as const,
      multipleImplementations: 'peek' as const,
      multipleTypeDefinitions: 'peek' as const
    }
  } as any), [
    value, language, currentTheme, readonly, showMinimap, showLineNumbers, 
    showWhitespace, showIndentGuides, wordWrap, fontSize, fontFamily, 
    tabSize, insertSpaces, autocompleteEnabled
  ]);

  /**
   * Инициализация Monaco Editor
   */
  useEffect(() => {
    const initializeEditor = async () => {
      try {
        setIsLoading(true);
        
        // Динамический импорт Monaco Editor
        const monaco = await import('monaco-editor');
        MonacoEditor = monaco;
        monacoRef.current = monaco;

        // Настройка языка BSL для Monaco
        setupBSLLanguage(monaco);

        if (editorRef.current) {
          const editorInstance = monaco.editor.create(editorRef.current, {
            ...monacoOptions,
            value
          });

          setEditor(editorInstance);

          // Подключение обработчиков событий
          setupEditorEventHandlers(editorInstance, monaco);

          setIsLoading(false);
        }
      } catch (error) {
        console.error('Ошибка инициализации Monaco Editor:', error);
        setIsLoading(false);
      }
    };

    initializeEditor();

    return () => {
      if (editor) {
        editor.dispose();
      }
    };
  }, []);

  /**
   * Обновление опций редактора при изменении props
   */
  useEffect(() => {
    if (editor && monacoRef.current) {
      const monaco = monacoRef.current;
      
      monaco.editor.setModelOptions(editor.getModel(), {
        tabSize,
        insertSpaces
      });

      monaco.editor.setTheme(getMonacoTheme(currentTheme));

      // Применение новых опций
      editor.updateOptions({
        theme: getMonacoTheme(currentTheme),
        readOnly: readonly,
        minimap: { enabled: showMinimap },
        lineNumbers: showLineNumbers ? 'on' : 'off' as const,
        renderWhitespace: (showWhitespace ? 'all' : 'none') as 'none' | 'boundary' | 'selection' | 'all' | 'trailing',
        renderIndentGuides: showIndentGuides,
        wordWrap: wordWrap as 'off' | 'on' | 'wordWrapColumn' | 'bounded',
        fontSize,
        fontFamily,
        suggest: {
          enabled: autocompleteEnabled
        }
      });
    }
  }, [
    editor, currentTheme, readonly, showMinimap, showLineNumbers, showWhitespace,
    showIndentGuides, wordWrap, fontSize, fontFamily, tabSize, insertSpaces, 
    autocompleteEnabled
  ]);

  /**
   * Обновление содержимого редактора
   */
  useEffect(() => {
    if (editor && value !== editor.getValue()) {
      editor.setValue(value);
    }
  }, [value, editor]);

  /**
   * Отображение ошибок и предупреждений
   */
  useEffect(() => {
    if (editor && monacoRef.current) {
      const monaco = monacoRef.current;
      
      // Очистка предыдущих маркеров
      monaco.editor.setModelMarkers(editor.getModel(), '1c-validator', []);

      // Добавление новых маркеров
      const markers: any[] = [];
      
      validationErrors.forEach(error => {
        markers.push({
          severity: monaco.MarkerSeverity.Error,
          message: error.message,
          startLineNumber: error.startLine,
          startColumn: error.startColumn,
          endLineNumber: error.endLine,
          endColumn: error.endColumn,
          source: error.source || '1C BSL Validator'
        });
      });

      warnings.forEach(warning => {
        markers.push({
          severity: monaco.MarkerSeverity.Warning,
          message: warning.message,
          startLineNumber: warning.startLine,
          startColumn: warning.startColumn,
          endLineNumber: warning.endLine,
          endColumn: warning.endColumn,
          source: '1C BSL Validator'
        });
      });

      monaco.editor.setModelMarkers(editor.getModel(), '1c-validator', markers);
    }
  }, [editor, validationErrors, warnings, monacoRef.current]);

  /**
   * Настройка языка BSL для Monaco
   */
  const setupBSLLanguage = useCallback((monaco: any) => {
    // Регистрация языка BSL
    monaco.languages.register({ id: 'bsl' });

    // Настройка токенизации для BSL
    monaco.languages.setMonarchTokensProvider('bsl', {
      tokenizer: {
        root: [
          // Комментарии
          [/\/\/.*$/, 'comment'],
          [/\/\*/, 'comment', '@comment'],

          // Строки
          [/"/, 'string', '@string_double'],
          [/'/, 'string', '@string_single'],

          // Числа
          [/\d*\.\d+([eE][\-+]?\d+)?/, 'number.float'],
          [/\d+/, 'number'],

          // Ключевые слова
          [/b(Строка|Число|Дата|Булево|ТаблицаЗначений_массив|Структура|Соответствие|СписокЗначений|ДеревоЗначений|Запрос|РезультатЗапроса|ВыборкаИзРезультатаЗапроса)b/, 'type'],
          [/b(Строка|Число|Дата|Булево|ТаблицаЗначений_массив|Структура|Соответствие|СписокЗначений|ДеревоЗначений|Запрос|РезультатЗапроса|ВыборкаИзРезультатаЗапроса)b/, 'type'],

          // Операторы
          [/[+\-*/=<>!&|^%]/, 'operator'],
          [/[{}()\[\]]/, '@brackets'],

          // Идентификаторы
          [/[a-zA-Z_]\w*/, 'identifier']
        ],

        comment: [
          [/[^\/*]+/, 'comment'],
          [/\*\//, 'comment', '@pop'],
          [/[\/*]/, 'comment']
        ],

        string_double: [
          [/[^\\"]+/, 'string'],
          [/\\./, 'string.escape'],
          [/"/, 'string', '@pop']
        ],

        string_single: [
          [/[^\\']+/, 'string'],
          [/\\./, 'string.escape'],
          [/'/, 'string', '@pop']
        ]
      }
    });

    // Настройка цветов для BSL
    monaco.editor.defineTheme('1c-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'keyword', foreground: '569cd6' },
        { token: 'type', foreground: '4ec9b0' },
        { token: 'string', foreground: 'ce9178' },
        { token: 'number', foreground: 'b5cea8' },
        { token: 'comment', foreground: '6a9955' },
        { token: 'operator', foreground: 'd4d4d4' },
        { token: 'identifier', foreground: 'd4d4d4' }
      ],
      colors: {
        'editor.background': '#1e1e1e',
        'editor.foreground': '#d4d4d4',
        'editorLineNumber.foreground': '#858585',
        'editorLineNumber.activeForeground': '#c6c6c6',
        'editor.selectionBackground': '#264f78',
        'editor.inactiveSelectionBackground': '#3a3d41'
      }
    });

    monaco.editor.defineTheme('1c-light', {
      base: 'vs',
      inherit: true,
      rules: [
        { token: 'keyword', foreground: '0000ff' },
        { token: 'type', foreground: '267f99' },
        { token: 'string', foreground: 'a31515' },
        { token: 'number', foreground: '098658' },
        { token: 'comment', foreground: '008000' },
        { token: 'operator', foreground: '000000' },
        { token: 'identifier', foreground: '001080' }
      ],
      colors: {
        'editor.background': '#ffffff',
        'editor.foreground': '#000000',
        'editorLineNumber.foreground': '#237893',
        'editor.selectionBackground': '#ADD6FF',
        'editor.inactiveSelectionBackground': '#e5ebf1'
      }
    });

    // Настройка сниппетов для BSL
    monaco.languages.registerCompletionItemProvider('bsl', {
      provideCompletionItems: async (model: any, position: any) => {
        if (!autocompleteEnabled) return { suggestions: [] };

        try {
          const codeContext: CodeContext = {
            document: model.getValue(),
            position: { line: position.lineNumber, character: position.column },
            languageId: 'bsl',
            fileName: 'module.bsl',
            currentLine: model.getLineContent(position.lineNumber),
            lines: model.getLinesContent(),
            beforeCursor: model.getValueInRange({
              startLineNumber: 1,
              startColumn: 1,
              endLineNumber: position.lineNumber,
              endColumn: position.column
            }),
            afterCursor: model.getValueInRange({
              startLineNumber: position.lineNumber,
              startColumn: position.column,
              endLineNumber: model.getLineCount(),
              endColumn: model.getLineMaxColumn(model.getLineCount())
            }),
            scope: {
              variables: [],
              functions: [],
              procedures: [],
              classes: [],
              objects: [],
              modules: []
            }
          };

          const completions = await codeAutocompleteService.getCompletions({
            position: { line: codeContext.position.line, column: codeContext.position.character },
            lineContent: codeContext.currentLine,
            filePath: codeContext.fileName,
            language: codeContext.languageId,
            projectStructure: [],
            recentEdits: [],
            cursorHistory: []
          });
          
          const suggestions = completions.map((completion: any) => ({
            label: completion.text || completion.label || '',
            kind: getMonacoCompletionKind(completion.type),
            insertText: completion.text || '',
            insertTextRules: completion.insertTextFormat === 2 ? monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet : undefined,
            documentation: completion.metadata?.description,
            detail: completion.type,
            sortText: completion.confidence?.toString(),
            filterText: completion.text
          }));

          return { suggestions };
        } catch (error) {
          console.error('Ошибка получения автодополнений:', error);
          return { suggestions: [] };
        }
      },

      triggerCharacters: ['.', '(', ',', ':', ' '],

      resolveCompletionItem: async (item: any) => {
        // Дополнительная обработка элемента автодополнения
        return item;
      }
    });

    // Настройка помощи при наведении для BSL
    monaco.languages.registerHoverProvider('bsl', {
      provideHover: async (model: any, position: any) => {
        try {
          const codeContext: CodeContext = {
            document: model.getValue(),
            position: { line: position.lineNumber, character: position.column },
            languageId: 'bsl',
            fileName: 'module.bsl',
            currentLine: model.getLineContent(position.lineNumber),
            lines: model.getLinesContent(),
            beforeCursor: model.getValueInRange({
              startLineNumber: 1,
              startColumn: 1,
              endLineNumber: position.lineNumber,
              endColumn: position.column
            }),
            afterCursor: model.getValueInRange({
              startLineNumber: position.lineNumber,
              startColumn: position.column,
              endLineNumber: model.getLineCount(),
              endColumn: model.getLineMaxColumn(model.getLineCount())
            }),
            scope: {
              variables: [],
              functions: [],
              procedures: [],
              classes: [],
              objects: [],
              modules: []
            }
          };

          // const hoverInfo = codeAutocompleteService.getHoverInfo(codeContext);
          // Temporarily disabled - service method doesn't exist
          
          return null;
        } catch (error) {
          console.error('Error in provideHover:', error);
          return null;
        }
      }
    });

  }, [autocompleteEnabled]);

  /**
   * Настройка обработчиков событий редактора
   */
  const setupEditorEventHandlers = useCallback((editorInstance: any, monaco: any) => {
    // Изменение содержимого
    editorInstance.onDidChangeModelContent((e: any) => {
      const newValue = editorInstance.getValue();
      onChange?.(newValue);

      // Автосохранение
      if (autoSave) {
        setTimeout(() => {
          onSave?.(newValue);
        }, 1000);
      }
    });

    // Сохранение по Ctrl+S
    editorInstance.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      onSave?.(editorInstance.getValue());
    });

    // Выполнение по Ctrl+F9
    editorInstance.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.F9, () => {
      onExecute?.(editorInstance.getValue());
    });

    // Форматирование кода по Shift+Alt+F
    editorInstance.addCommand(monaco.KeyMod.Shift | monaco.KeyMod.Alt | monaco.KeyCode.KeyF, () => {
      if (autoFormat) {
        editorInstance.getAction('editor.action.formatDocument').run();
      }
    });

    // Автодополнение по Ctrl+Space
    editorInstance.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Space, () => {
      editorInstance.trigger('keyboard', 'editor.action.triggerSuggest', {});
    });

    // Переход к определению по F12
    editorInstance.addCommand(monaco.KeyCode.F12, () => {
      editorInstance.getAction('editor.action.revealDefinition').run();
    });

    // Поиск по Ctrl+F
    editorInstance.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyF, () => {
      setShowSearch(true);
    });

    // Глобальная замена по Ctrl+H
    editorInstance.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyH, () => {
      setShowSearch(true);
      setReplaceQuery('');
    });

    // Полноэкранный режим по F11
    editorInstance.addCommand(monaco.KeyCode.F11, () => {
      setIsFullscreen(true);
    });

    // Настройка виджетов
    editorInstance.onDidChangeCursorSelection((e: any) => {
      const selection = e.selection;
      const selectedText = editorInstance.getModel().getValueInRange(selection);
      
      // Показать дополнительную информацию при выделении
      if (selectedText && selectedText.length > 0) {
        // Логика для показа информации о выделенном коде
      }
    });

    // Настройка действий через светящуюся лампочку
    const lightbulbWidget = editorInstance.getContribution('editor.action.lightbulb');
    if (lightbulbWidget && typeof lightbulbWidget.setEnabled === 'function') {
      (lightbulbWidget as any).setEnabled(true);
    }

  }, [onChange, onSave, onExecute, autoSave, autoFormat]);

  /**
   * Поиск в редакторе
   */
  const handleSearch = useCallback((query: string, replace?: string) => {
    if (!editor || !monacoRef.current) return;

    const monaco = monacoRef.current;
    
    if (!query) {
      setSearchResults([]);
      return;
    }

    const model = editor.getModel();
    const allText = model.getValue();
    const lines = allText.split('\n');
    const results: any[] = [];

    lines.forEach((line: string, index: number) => {
      const lineNumber = index + 1;
      let searchIndex = 0;
      let match;
      
      const regex = new RegExp(query, 'gi');
      while ((match = regex.exec(line)) !== null) {
        results.push({
          lineNumber,
          column: match.index + 1,
          text: line.trim(),
          match: match[0]
        });
      }
    });

    setSearchResults(results);
    
    if (results.length > 0) {
      const currentResult = results[Math.min(currentSearchIndex, results.length - 1)];
      editor.revealLineInCenter(currentResult.lineNumber);
      editor.setPosition({
        lineNumber: currentResult.lineNumber,
        column: currentResult.column
      });
      editor.focus();
    }
  }, [editor, currentSearchIndex]);

  /**
   * Замена найденного текста
   */
  const handleReplace = useCallback((query: string, replacement: string) => {
    if (!editor || !monacoRef.current || !query) return;

    const monaco = monacoRef.current;
    const model = editor.getModel();
    const fullText = model.getValue();
    
    if (replacement) {
      const newText = fullText.replace(new RegExp(query, 'g'), replacement);
      editor.setValue(newText);
      onChange?.(newText);
    }
  }, [editor, onChange]);

  /**
   * Навигация по результатам поиска
   */
  const navigateSearchResults = useCallback((direction: 'next' | 'prev') => {
    if (searchResults.length === 0) return;

    if (direction === 'next') {
      setCurrentSearchIndex((prev) => (prev + 1) % searchResults.length);
    } else {
      setCurrentSearchIndex((prev) => (prev - 1 + searchResults.length) % searchResults.length);
    }
  }, [searchResults.length]);

  /**
   * Получение темы Monaco
   */
  function getMonacoTheme(theme: string): string {
    switch (theme) {
      case 'dark':
        return 'vs-dark';
      case 'light':
        return 'vs';
      case '1c':
        return '1c-dark';
      default:
        return 'vs-dark';
    }
  }

  /**
   * Получение типа иконки для Monaco
   */
  function getMonacoCompletionKind(kind: number): any {
    const monaco = monacoRef.current;
    if (!monaco || !monaco.languages?.CompletionItemKind) return 1;

    const kindMap: { [key: number]: any } = {
      1: monaco.languages.CompletionItemKind.Text,
      2: monaco.languages.CompletionItemKind.Method,
      3: monaco.languages.CompletionItemKind.Function,
      4: monaco.languages.CompletionItemKind.Constructor,
      5: monaco.languages.CompletionItemKind.Field,
      6: monaco.languages.CompletionItemKind.Variable,
      7: monaco.languages.CompletionItemKind.Class,
      8: monaco.languages.CompletionItemKind.Interface,
      9: monaco.languages.CompletionItemKind.Module,
      10: monaco.languages.CompletionItemKind.Property,
      11: monaco.languages.CompletionItemKind.Unit,
      12: monaco.languages.CompletionItemKind.Value,
      13: monaco.languages.CompletionItemKind.Enum,
      14: monaco.languages.CompletionItemKind.Keyword,
      15: monaco.languages.CompletionItemKind.Snippet,
      16: monaco.languages.CompletionItemKind.Color,
      17: monaco.languages.CompletionItemKind.File,
      18: monaco.languages.CompletionItemKind.Reference,
      19: monaco.languages.CompletionItemKind.Customcolor,
      20: monaco.languages.CompletionItemKind.Folder,
      21: monaco.languages.CompletionItemKind.TypeParameter,
      22: monaco.languages.CompletionItemKind.User,
      23: monaco.languages.CompletionItemKind.Issue,
      24: monaco.languages.CompletionItemKind.Snippet
    };

    return kindMap[kind] || monaco.languages.CompletionItemKind.Text;
  }

  /**
   * Форматирование кода
   */
  const formatCode = useCallback(() => {
    if (editor && autoFormat) {
      editor.getAction('editor.action.formatDocument').run();
    }
  }, [editor, autoFormat]);

  /**
   * Комментирование/раскомментирование строк
   */
  const toggleComment = useCallback(() => {
    if (editor) {
      editor.getAction('editor.action.commentLine').run();
    }
  }, [editor]);

  /**
   * Получение статистики кода
   */
  const getCodeStats = useMemo(() => {
    if (!value) return { lines: 0, words: 0, characters: 0, size: 0 };

    const lines = value.split('\n').length;
    const words = value.trim().split(/\s+/).filter(word => word.length > 0).length;
    const characters = value.length;
    const size = new Blob([value]).size;

    return { lines, words, characters, size };
  }, [value]);

  // Отображение статуса ошибок
  const errorCount = validationErrors.length;
  const warningCount = warnings.length;

  return (
    <div className={`code-editor ${className} ${isFullscreen ? 'fixed inset-0 z-50 bg-white' : ''}`}>
      {/* Панель инструментов */}
      <div className="bg-gray-50 border-b border-gray-200 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Code className="w-5 h-5 text-gray-600" />
          <span className="text-sm font-medium text-gray-900">Редактор кода 1С</span>
          
          {errorCount > 0 && (
            <div className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 rounded text-xs">
              <AlertCircle className="w-3 h-3" />
              {errorCount} ошибок
            </div>
          )}
          
          {warningCount > 0 && (
            <div className="flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">
              <AlertCircle className="w-3 h-3" />
              {warningCount} предупреждений
            </div>
          )}

          {getCodeStats.lines > 0 && (
            <div className="text-xs text-gray-500">
              {getCodeStats.lines} строк, {getCodeStats.words} слов, {(getCodeStats.size / 1024).toFixed(1)} KB
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Поиск */}
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
            title="Поиск (Ctrl+F)"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Форматирование */}
          <button
            onClick={formatCode}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
            title="Форматировать код (Shift+Alt+F)"
          >
            <Palette className="w-4 h-4" />
          </button>

          {/* Комментарии */}
          <button
            onClick={toggleComment}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
            title="Комментировать/раскомментировать (Ctrl+/)"
          >
            <FileText className="w-4 h-4" />
          </button>

          {/* Выполнение */}
          {onExecute && (
            <button
              onClick={() => onExecute(value)}
              className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
              title="Выполнить код (Ctrl+F9)"
            >
              <Play className="w-4 h-4" />
              Выполнить
            </button>
          )}

          {/* Сохранение */}
          {onSave && (
            <button
              onClick={() => onSave(value)}
              className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
              title="Сохранить (Ctrl+S)"
            >
              <Save className="w-4 h-4" />
              Сохранить
            </button>
          )}

          {/* Настройки */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
            title="Настройки"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Полноэкранный режим */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
            title="Полноэкранный режим (F11)"
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>

          {/* Справка */}
          <button
            onClick={() => setShowHelp(!showHelp)}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
            title="Справка"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Панель поиска */}
      {showSearch && (
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex-1 flex items-center gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  handleSearch(e.target.value);
                }}
                placeholder="Найти..."
                className="flex-1 px-3 py-1 border border-gray-300 rounded text-sm"
                autoFocus
              />
              
              <input
                type="text"
                value={replaceQuery}
                onChange={(e) => setReplaceQuery(e.target.value)}
                placeholder="Заменить..."
                className="w-32 px-3 py-1 border border-gray-300 rounded text-sm"
              />
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => handleSearch(searchQuery, replaceQuery)}
                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
              >
                Заменить все
              </button>
              
              <button
                onClick={() => navigateSearchResults('prev')}
                className="p-1 text-gray-600 hover:text-gray-900"
                title="Предыдущий (Shift+F3)"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <button
                onClick={() => navigateSearchResults('next')}
                className="p-1 text-gray-600 hover:text-gray-900"
                title="Следующий (F3)"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              {searchResults.length > 0 && (
                <span className="text-sm text-gray-600">
                  {currentSearchIndex + 1} из {searchResults.length}
                </span>
              )}
            </div>

            <button
              onClick={() => {
                setShowSearch(false);
                setSearchQuery('');
                setReplaceQuery('');
                setSearchResults([]);
              }}
              className="p-1 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Панель настроек */}
      {showSettings && (
        <div className="bg-gray-100 border-b border-gray-200 px-4 py-3">
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Тема</label>
              <select
                value={currentTheme}
                onChange={(e) => setCurrentTheme(e.target.value as any)}
                className="w-full px-3 py-1 border border-gray-300 rounded text-sm"
              >
                <option value="1c">1С темная</option>
                <option value="dark">Темная</option>
                <option value="light">Светлая</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Размер шрифта</label>
              <input
                type="number"
                value={fontSize}
                onChange={(e) => {
                  // Font size обновляется через useEffect
                }}
                min="10"
                max="24"
                className="w-full px-3 py-1 border border-gray-300 rounded text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Размер табуляции</label>
              <select
                value={tabSize}
                onChange={(e) => {
                  // Tab size обновляется через useEffect
                }}
                className="w-full px-3 py-1 border border-gray-300 rounded text-sm"
              >
                <option value={2}>2</option>
                <option value={4}>4</option>
                <option value={8}>8</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Перенос строк</label>
              <select
                value={wordWrap}
                onChange={(e) => {
                  // Word wrap обновляется через useEffect
                }}
                className="w-full px-3 py-1 border border-gray-300 rounded text-sm"
              >
                <option value="off">Выкл</option>
                <option value="on">Вкл</option>
                <option value="wordWrapColumn">По колонке</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-4 mt-3">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={autocompleteEnabled}
                onChange={(e) => setAutocompleteEnabled(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm text-gray-700">Автодополнение</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={showLineNumbers}
                onChange={(e) => {
                  // Line numbers обновляются через useEffect
                }}
                className="rounded"
              />
              <span className="text-sm text-gray-700">Номера строк</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={showMinimap}
                onChange={(e) => {
                  // Minimap обновляется через useEffect
                }}
                className="rounded"
              />
              <span className="text-sm text-gray-700">Миникарта</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={showWhitespace}
                onChange={(e) => {
                  // Whitespace обновляется через useEffect
                }}
                className="rounded"
              />
              <span className="text-sm text-gray-700">Пробелы</span>
            </label>
          </div>
        </div>
      )}

      {/* Панель справки */}
      {showHelp && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-3">
          <div className="text-sm text-gray-700">
            <strong>Горячие клавиши:</strong> Ctrl+S - сохранить | Ctrl+F - поиск | Ctrl+/ - комментарий | 
            Ctrl+F9 - выполнить | F11 - полноэкранный | Shift+Alt+F - форматирование
          </div>
        </div>
      )}

      {/* Редактор */}
      <div 
        ref={containerRef}
        className="relative"
        style={{ height: isFullscreen ? 'calc(100vh - 140px)' : height, width }}
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
            <div className="flex items-center gap-2 text-gray-600">
              <RotateCcw className="w-5 h-5 animate-spin" />
              <span>Загрузка редактора...</span>
            </div>
          </div>
        )}

        <div 
          ref={editorRef} 
          className="w-full h-full"
          style={{ display: isLoading ? 'none' : 'block' }}
        />
      </div>

      {/* Строка состояния */}
      <div className="bg-gray-100 border-t border-gray-200 px-4 py-1 text-xs text-gray-600 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span>Язык: {language.toUpperCase()}</span>
          <span>Строка: {editor?.getPosition()?.lineNumber || 1}, Колонка: {editor?.getPosition()?.column || 1}</span>
          <span>Выделено: {editor?.getSelection()?.getLength() || 0} символов</span>
        </div>

        <div className="flex items-center gap-2">
          {autocompleteEnabled && (
            <span className="flex items-center gap-1">
              <Zap className="w-3 h-3" />
              Автодополнение активно
            </span>
          )}
          
          {autoSave && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Автосохранение
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default CodeEditor;