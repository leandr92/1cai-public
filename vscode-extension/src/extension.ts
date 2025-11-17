/**
 * 1С:Copilot VSCode Extension
 * AI pair programmer for BSL
 */

import * as vscode from 'vscode';
import axios from 'axios';

export function activate(context: vscode.ExtensionContext) {
    console.log('1С:Copilot is now active!');
    
    // Register commands
    context.subscriptions.push(
        vscode.commands.registerCommand('1c-copilot.generateFunction', generateFunction)
    );
    
    context.subscriptions.push(
        vscode.commands.registerCommand('1c-copilot.optimizeCode', optimizeCode)
    );
    
    context.subscriptions.push(
        vscode.commands.registerCommand('1c-copilot.generateTests', generateTests)
    );
    
    // Register autocomplete provider
    const provider = new CopilotCompletionProvider();
    context.subscriptions.push(
        vscode.languages.registerCompletionItemProvider('bsl', provider, '.')
    );
    
    vscode.window.showInformationMessage('1С:Copilot готов! Нажмите Ctrl+Shift+G для генерации функции.');
}

class CopilotCompletionProvider implements vscode.CompletionItemProvider {
    /**
     * Autocomplete provider
     * Предлагает suggestions во время набора кода
     */
    
    async provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken,
        context: vscode.CompletionContext
    ): Promise<vscode.CompletionItem[]> {
        
        // Get current line and context
        const lineText = document.lineAt(position).text;
        const beforeCursor = lineText.substring(0, position.character);
        
        // Get context (previous 10 lines)
        const contextLines: string[] = [];
        for (let i = Math.max(0, position.line - 10); i < position.line; i++) {
            contextLines.push(document.lineAt(i).text);
        }
        const contextText = contextLines.join('\n');
        
        // Call AI backend
        try {
            const config = vscode.workspace.getConfiguration('1c-copilot');
            const apiUrl = config.get<string>('apiUrl', 'http://localhost:8000/api/copilot');
            const apiKey = config.get<string>('apiKey', '');
            
            const response = await axios.post(
                `${apiUrl}/complete`,
                {
                    code: contextText,
                    current_line: beforeCursor,
                    language: 'bsl'
                },
                {
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 3000  // 3 seconds max
                }
            );
            
            const suggestions = response.data.suggestions || [];
            
            // Convert to CompletionItems
            return suggestions.map((suggestion: any, index: number) => {
                const item = new vscode.CompletionItem(
                    suggestion.text,
                    vscode.CompletionItemKind.Snippet
                );
                item.detail = '1С:Copilot';
                item.documentation = new vscode.MarkdownString(suggestion.description || '');
                item.sortText = `00${index}`;  // Priority
                return item;
            });
            
        } catch (error) {
            // Silent fail - не мешаем работе
            console.error('Copilot error:', error);
            return [];
        }
    }
}

async function generateFunction() {
    /**
     * Generate function from comment
     */
    
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return;
    }
    
    // Get selected text or prompt user
    let prompt = editor.document.getText(editor.selection);
    
    if (!prompt) {
        prompt = await vscode.window.showInputBox({
            prompt: 'Опишите функцию которую нужно создать',
            placeHolder: 'Например: Функция для расчета НДС'
        }) || '';
    }
    
    if (!prompt) {
        return;
    }
    
    // Show progress
    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: '1С:Copilot генерирует функцию...',
        cancellable: false
    }, async (progress) => {
        try {
            const config = vscode.workspace.getConfiguration('1c-copilot');
            const apiUrl = config.get<string>('apiUrl', '');
            const apiKey = config.get<string>('apiKey', '');
            
            const response = await axios.post(
                `${apiUrl}/generate`,
                {
                    prompt: prompt,
                    language: 'bsl',
                    type: 'function'
                },
                {
                    headers: {
                        'Authorization': `Bearer ${apiKey}`
                    }
                }
            );
            
            const generatedCode = response.data.code;
            
            // Insert generated code at cursor
            editor.edit(editBuilder => {
                editBuilder.insert(editor.selection.active, generatedCode);
            });
            
            vscode.window.showInformationMessage('✅ Функция сгенерирована!');
            
        } catch (error: any) {
            vscode.window.showErrorMessage(`Ошибка: ${error.message}`);
        }
    });
}

async function optimizeCode() {
    /**
     * Optimize selected code
     */
    
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return;
    }
    
    const selectedText = editor.document.getText(editor.selection);
    
    if (!selectedText) {
        vscode.window.showWarningMessage('Выделите код для оптимизации');
        return;
    }
    
    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: '1С:Copilot оптимизирует код...'
    }, async () => {
        try {
            const config = vscode.workspace.getConfiguration('1c-copilot');
            const apiUrl = config.get<string>('apiUrl', '');
            const apiKey = config.get<string>('apiKey', '');
            
            const response = await axios.post(
                `${apiUrl}/optimize`,
                {
                    code: selectedText,
                    language: 'bsl'
                },
                {
                    headers: {
                        'Authorization': `Bearer ${apiKey}`
                    }
                }
            );
            
            const optimizedCode = response.data.optimized_code;
            const improvements = response.data.improvements || [];
            
            // Replace selected text with optimized version
            editor.edit(editBuilder => {
                editBuilder.replace(editor.selection, optimizedCode);
            });
            
            // Show improvements
            const improvementText = improvements.join('\n- ');
            vscode.window.showInformationMessage(
                `✅ Код оптимизирован!\n\nУлучшения:\n- ${improvementText}`
            );
            
        } catch (error: any) {
            vscode.window.showErrorMessage(`Ошибка: ${error.message}`);
        }
    });
}

async function generateTests() {
    /**
     * Generate tests for selected function
     */
    
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return;
    }
    
    const selectedText = editor.document.getText(editor.selection);
    
    if (!selectedText) {
        vscode.window.showWarningMessage('Выделите функцию для генерации тестов');
        return;
    }
    
    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: '1С:Copilot генерирует тесты...'
    }, async () => {
        try {
            const config = vscode.workspace.getConfiguration('1c-copilot');
            const apiUrl = config.get<string>('apiUrl', '');
            const apiKey = config.get<string>('apiKey', '');
            
            const response = await axios.post(
                `${apiUrl}/generate-tests`,
                {
                    code: selectedText,
                    language: 'bsl'
                },
                {
                    headers: {
                        'Authorization': `Bearer ${apiKey}`
                    }
                }
            );
            
            const tests = response.data.tests;
            
            // Create new file with tests
            const doc = await vscode.workspace.openTextDocument({
                content: tests,
                language: 'bsl'
            });
            
            await vscode.window.showTextDocument(doc);
            
            vscode.window.showInformationMessage('✅ Тесты сгенерированы!');
            
        } catch (error: any) {
            vscode.window.showErrorMessage(`Ошибка: {error.message}`);
        }
    });
}

export function deactivate() {}


