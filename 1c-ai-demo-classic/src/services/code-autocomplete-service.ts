export interface CodeSuggestion {
  id: string;
  text: string;
  type: 'completion' | 'snippet' | 'function' | 'variable' | 'class' | 'import';
  confidence: number; // 0-1
  position: {
    line: number;
    column: number;
  };
  context: string;
  metadata?: {
    filePath: string;
    language: string;
    scope: string;
  };
}

export interface CompletionContext {
  position: {
    line: number;
    column: number;
  };
  lineContent: string;
  filePath: string;
  language: string;
  projectStructure: ProjectSymbol[];
  recentEdits: TextChange[];
  cursorHistory: CursorPosition[];
}

export interface TextChange {
  range: {
    start: { line: number; column: number };
    end: { line: number; column: number };
  };
  text: string;
  timestamp: Date;
}

export interface CursorPosition {
  line: number;
  column: number;
  timestamp: Date;
}

export interface ProjectSymbol {
  name: string;
  kind: 'variable' | 'function' | 'class' | 'interface' | 'type' | 'namespace';
  location: {
    filePath: string;
    range: {
      start: { line: number; column: number };
      end: { line: number; column: number };
    };
  };
  documentation?: string;
  signature?: string;
}

export interface AutocompleteConfig {
  enabled: boolean;
  triggerCharacters: string[];
  debounceMs: number;
  maxSuggestions: number;
  languageFeatures: {
    [language: string]: {
      enabled: boolean;
      customSnippets: CodeSnippet[];
    };
  };
}

export interface CodeSnippet {
  name: string;
  description: string;
  body: string[];
  language: string;
  keywords: string[];
}

export class CodeAutocompleteService {
  private config: AutocompleteConfig;
  private symbols: Map<string, ProjectSymbol[]> = new Map();
  private snippets: CodeSnippet[] = [];
  private contextHistory: CompletionContext[] = [];
  private recentSuggestions: CodeSuggestion[] = [];

  constructor() {
    this.config = {
      enabled: true,
      triggerCharacters: ['.', ' ', '(', '[', '{', '"', "'", '/'],
      debounceMs: 300,
      maxSuggestions: 20,
      languageFeatures: {
        typescript: {
          enabled: true,
          customSnippets: this.getTypeScriptSnippets()
        },
        javascript: {
          enabled: true,
          customSnippets: this.getJavaScriptSnippets()
        },
        css: {
          enabled: true,
          customSnippets: this.getCSSSnippets()
        },
        html: {
          enabled: true,
          customSnippets: this.getHTMLSnippets()
        }
      }
    };

    this.initializeDefaultSnippets();
  }

  private getTypeScriptSnippets(): CodeSnippet[] {
    return [
      {
        name: 'interface',
        description: 'Create interface definition',
        body: [
          'interface ${1:InterfaceName} {',
          '  ${2:property}: ${3:Type};',
          '}'
        ],
        language: 'typescript',
        keywords: ['interface', 'type', 'object']
      },
      {
        name: 'function',
        description: 'Create function declaration',
        body: [
          'function ${1:functionName}(${2:params}): ${3:ReturnType} {',
          '  ${4:// function body}',
          '}'
        ],
        language: 'typescript',
        keywords: ['function', 'method', 'return']
      },
      {
        name: 'async-function',
        description: 'Create async function',
        body: [
          'async function ${1:functionName}(${2:params}): Promise<${3:ReturnType}> {',
          '  ${4:// async function body}',
          '  return ${5:value};',
          '}'
        ],
        language: 'typescript',
        keywords: ['async', 'promise', 'await']
      }
    ];
  }

  private getJavaScriptSnippets(): CodeSnippet[] {
    return [
      {
        name: 'for-loop',
        description: 'Create for loop',
        body: [
          'for (let ${1:i} = 0; ${1:i} < ${2:length}; ${1}i++) {',
          '  ${3:// loop body}',
          '}'
        ],
        language: 'javascript',
        keywords: ['for', 'loop', 'iteration']
      },
      {
        name: 'map-function',
        description: 'Create map function',
        body: [
          '${1:array}.map(${2:item} => {',
          '  return ${3:item};',
          '})'
        ],
        language: 'javascript',
        keywords: ['map', 'array', 'transform']
      }
    ];
  }

  private getCSSSnippets(): CodeSnippet[] {
    return [
      {
        name: 'flex-center',
        description: 'Flexbox center alignment',
        body: [
          'display: flex;',
          'justify-content: center;',
          'align-items: center;'
        ],
        language: 'css',
        keywords: ['flex', 'center', 'layout']
      },
      {
        name: 'grid',
        description: 'CSS Grid layout',
        body: [
          'display: grid;',
          'grid-template-columns: ${1:repeat(${2:3}, 1fr)};',
          'gap: ${3:1rem};'
        ],
        language: 'css',
        keywords: ['grid', 'layout', 'responsive']
      }
    ];
  }

  private getHTMLSnippets(): CodeSnippet[] {
    return [
      {
        name: 'div-container',
        description: 'Create div container',
        body: [
          '<div class="${1:container}">',
          '  ${2:content}',
          '</div>'
        ],
        language: 'html',
        keywords: ['div', 'container', 'element']
      },
      {
        name: 'form',
        description: 'Create form element',
        body: [
          '<form action="${1:action}" method="${2:post}">',
          '  <input type="text" name="${3:name}" required>',
          '  <button type="submit">${4:Submit}</button>',
          '</form>'
        ],
        language: 'html',
        keywords: ['form', 'input', 'button']
      }
    ];
  }

  private initializeDefaultSnippets(): void {
    const allSnippets: CodeSnippet[] = [
      ...this.config.languageFeatures.typescript.customSnippets,
      ...this.config.languageFeatures.javascript.customSnippets,
      ...this.config.languageFeatures.css.customSnippets,
      ...this.config.languageFeatures.html.customSnippets
    ];

    this.snippets = allSnippets;
  }

  async getCompletions(
    context: CompletionContext,
    triggerCharacter?: string
  ): Promise<CodeSuggestion[]> {
    if (!this.config.enabled) {
      return [];
    }

    const { position, lineContent, language } = context;
    
    // Store context for learning
    this.contextHistory.push(context);
    if (this.contextHistory.length > 100) {
      this.contextHistory = this.contextHistory.slice(-50);
    }

    const suggestions: CodeSuggestion[] = [];

    try {
      // Get language-specific suggestions
      const languageSuggestions = await this.getLanguageSpecificSuggestions(
        language,
        context,
        triggerCharacter
      );
      suggestions.push(...languageSuggestions);

      // Get symbol-based suggestions
      const symbolSuggestions = await this.getSymbolBasedSuggestions(context);
      suggestions.push(...symbolSuggestions);

      // Get snippet suggestions
      const snippetSuggestions = await this.getSnippetSuggestions(context);
      suggestions.push(...snippetSuggestions);

      // Filter and rank suggestions
      const filteredSuggestions = this.filterAndRankSuggestions(suggestions, context);

      // Store recent suggestions for analytics
      this.recentSuggestions.push(...filteredSuggestions);
      if (this.recentSuggestions.length > 500) {
        this.recentSuggestions = this.recentSuggestions.slice(-200);
      }

      return filteredSuggestions;
    } catch (error) {
      console.error('Error generating completions:', error);
      return [];
    }
  }

  private async getLanguageSpecificSuggestions(
    language: string,
    context: CompletionContext,
    triggerCharacter?: string
  ): Promise<CodeSuggestion[]> {
    const suggestions: CodeSuggestion[] = [];

    switch (language.toLowerCase()) {
      case 'typescript':
      case 'javascript':
        suggestions.push(...await this.getJavaScriptSuggestions(context, triggerCharacter));
        break;
      case 'css':
        suggestions.push(...await this.getCSSSuggestions(context, triggerCharacter));
        break;
      case 'html':
        suggestions.push(...await this.getHTMLSuggestions(context, triggerCharacter));
        break;
    }

    return suggestions;
  }

  private async getJavaScriptSuggestions(
    context: CompletionContext,
    triggerCharacter?: string
  ): Promise<CodeSuggestion[]> {
    const suggestions: CodeSuggestion[] = [];
    const { lineContent } = context;

    // Common JavaScript completions
    if (lineContent.includes('console.log')) {
      suggestions.push({
        id: 'console-debug',
        text: 'console.log(${1:value});',
        type: 'snippet',
        confidence: 0.9,
        position: context.position,
        context: lineContent
      });
    }

    if (lineContent.includes('function ')) {
      suggestions.push({
        id: 'function-declaration',
        text: 'function ${1:name}(${2:params}) {\n  ${3:// body}\n}',
        type: 'function',
        confidence: 0.8,
        position: context.position,
        context: lineContent
      });
    }

    // TypeScript specific
    if (lineContent.includes(':') && !lineContent.includes('console')) {
      suggestions.push({
        id: 'typescript-type',
        text: 'string | number | boolean | null | undefined',
        type: 'completion',
        confidence: 0.7,
        position: context.position,
        context: lineContent
      });
    }

    return suggestions;
  }

  private async getCSSSuggestions(
    context: CompletionContext,
    triggerCharacter?: string
  ): Promise<CodeSuggestion[]> {
    const suggestions: CodeSuggestion[] = [];
    const { lineContent } = context;

    if (lineContent.includes('background')) {
      suggestions.push({
        id: 'background-color',
        text: 'background-color: ${1:#ffffff};',
        type: 'completion',
        confidence: 0.9,
        position: context.position,
        context: lineContent
      });
    }

    if (lineContent.includes('display')) {
      suggestions.push({
        id: 'display-flex',
        text: 'flex',
        type: 'completion',
        confidence: 0.8,
        position: context.position,
        context: lineContent
      });
    }

    return suggestions;
  }

  private async getHTMLSuggestions(
    context: CompletionContext,
    triggerCharacter?: string
  ): Promise<CodeSuggestion[]> {
    const suggestions: CodeSuggestion[] = [];
    const { lineContent } = context;

    if (lineContent.includes('<div')) {
      suggestions.push({
        id: 'div-class',
        text: 'class="${1:container}"',
        type: 'completion',
        confidence: 0.8,
        position: context.position,
        context: lineContent
      });
    }

    return suggestions;
  }

  private async getSymbolBasedSuggestions(
    context: CompletionContext
  ): Promise<CodeSuggestion[]> {
    const suggestions: CodeSuggestion[] = [];
    const { filePath } = context;
    const projectSymbols = this.symbols.get(filePath) || [];

    // Filter symbols by context
    const relevantSymbols = projectSymbols.filter(symbol => 
      this.isSymbolRelevant(symbol, context)
    );

    relevantSymbols.forEach(symbol => {
      suggestions.push({
        id: `symbol-${symbol.name}`,
        text: symbol.name,
        type: symbol.kind as CodeSuggestion['type'],
        confidence: 0.7,
        position: context.position,
        context: context.lineContent,
        metadata: {
          filePath: symbol.location.filePath,
          language: context.language,
          scope: 'project'
        }
      });
    });

    return suggestions;
  }

  private isSymbolRelevant(symbol: ProjectSymbol, context: CompletionContext): boolean {
    // Simple relevance check - can be enhanced with more sophisticated logic
    const currentWord = this.getCurrentWord(context.lineContent, context.position.column);
    return symbol.name.toLowerCase().includes(currentWord.toLowerCase());
  }

  private getCurrentWord(lineContent: string, column: number): string {
    const beforeCursor = lineContent.substring(0, column);
    const wordMatch = beforeCursor.match(/[a-zA-Z_][a-zA-Z0-9_]*$/);
    return wordMatch ? wordMatch[0] : '';
  }

  private async getSnippetSuggestions(
    context: CompletionContext
  ): Promise<CodeSuggestion[]> {
    const suggestions: CodeSuggestion[] = [];
    const { language, lineContent } = context;

    const languageSnippets = this.snippets.filter(snippet => 
      snippet.language === language
    );

    languageSnippets.forEach(snippet => {
      // Check if snippet keywords match current context
      const relevanceScore = this.calculateSnippetRelevance(snippet, context);
      
      if (relevanceScore > 0.3) {
        suggestions.push({
          id: `snippet-${snippet.name}`,
          text: snippet.body.join('\n'),
          type: 'snippet',
          confidence: relevanceScore,
          position: context.position,
          context: lineContent
        });
      }
    });

    return suggestions;
  }

  private calculateSnippetRelevance(snippet: CodeSnippet, context: CompletionContext): number {
    const { lineContent } = context;
    
    // Check if snippet keywords appear in current line
    const keywordMatches = snippet.keywords.filter(keyword =>
      lineContent.toLowerCase().includes(keyword.toLowerCase())
    );

    return Math.min(keywordMatches.length / snippet.keywords.length, 1);
  }

  private filterAndRankSuggestions(
    suggestions: CodeSuggestion[],
    context: CompletionContext
  ): CodeSuggestion[] {
    // Remove duplicates
    const uniqueSuggestions = suggestions.filter((suggestion, index, self) =>
      index === self.findIndex(s => s.text === suggestion.text)
    );

    // Sort by confidence and type priority
    const typePriority = {
      'snippet': 4,
      'function': 3,
      'completion': 2,
      'variable': 1
    };

    const rankedSuggestions = uniqueSuggestions.sort((a, b) => {
      const scoreA = a.confidence * (typePriority[a.type] || 1);
      const scoreB = b.confidence * (typePriority[b.type] || 1);
      return scoreB - scoreA;
    });

    return rankedSuggestions.slice(0, this.config.maxSuggestions);
  }

  updateProjectSymbols(filePath: string, symbols: ProjectSymbol[]): void {
    this.symbols.set(filePath, symbols);
  }

  registerSnippet(snippet: CodeSnippet): void {
    this.snippets.push(snippet);
  }

  getSnippets(language?: string): CodeSnippet[] {
    if (language) {
      return this.snippets.filter(snippet => snippet.language === language);
    }
    return [...this.snippets];
  }

  updateConfig(config: Partial<AutocompleteConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): AutocompleteConfig {
    return { ...this.config };
  }

  recordSuggestionUsage(suggestion: CodeSuggestion, accepted: boolean): void {
    // Analytics - could be used to improve suggestion ranking
    const existing = this.recentSuggestions.find(s => s.id === suggestion.id);
    if (existing) {
      existing.confidence = accepted ? Math.min(existing.confidence + 0.1, 1) : 
                                          Math.max(existing.confidence - 0.05, 0);
    }
  }

  getAnalytics(): {
    totalSuggestions: number;
    averageConfidence: number;
    mostUsedSnippets: CodeSnippet[];
    contextHistoryLength: number;
  } {
    const totalSuggestions = this.recentSuggestions.length;
    const averageConfidence = totalSuggestions > 0 ? 
      this.recentSuggestions.reduce((sum, s) => sum + s.confidence, 0) / totalSuggestions : 0;

    // Get most used snippets
    const snippetUsage = new Map<string, number>();
    this.recentSuggestions.forEach(suggestion => {
      if (suggestion.type === 'snippet') {
        const current = snippetUsage.get(suggestion.id) || 0;
        snippetUsage.set(suggestion.id, current + 1);
      }
    });

    const mostUsedSnippets = Array.from(snippetUsage.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([snippetId]) => {
        return this.snippets.find(s => `snippet-${s.name}` === snippetId);
      })
      .filter(Boolean) as CodeSnippet[];

    return {
      totalSuggestions,
      averageConfidence: Math.round(averageConfidence * 100) / 100,
      mostUsedSnippets,
      contextHistoryLength: this.contextHistory.length
    };
  }
}

// Export singleton instance
export const codeAutocompleteService = new CodeAutocompleteService();