import { Injectable } from '@angular/core';

/** Global monaco editor instance provided by the library */
declare const monaco: any;

/**
 * Service for managing Monaco editor instances in the template playground.
 * Handles language configuration and editor lifecycle.
 */
@Injectable({
  providedIn: 'root'
})
export class TemplateEditorService {
  /** The active Monaco editor instance */
  private editor: any;
  /** Callback function triggered when the editor content changes */
  private onChangeCallback: ((value: string) => void) | null = null;

  /**
   * Initializes the Monaco Editor into the provided DOM container.
   * Sets default configuration and basic change listeners.
   * @param container - HTML element to host the editor
   */
  initializeEditor(container: HTMLElement) {
    // Initialize Monaco Editor
    this.editor = monaco.editor.create(container, {
      value: '',
      language: 'html',
      theme: 'vs-dark',
      automaticLayout: true,
      minimap: {
        enabled: true
      },
      scrollBeyondLastLine: false,
      fontSize: 14,
      wordWrap: 'on',
      lineNumbers: 'on',
      roundedSelection: false,
      scrollbar: {
        horizontal: 'visible',
        vertical: 'visible'
      },
      overviewRulerLanes: 2,
      quickSuggestions: {
        other: true,
        comments: true,
        strings: true
      },
      parameterHints: {
        enabled: true
      },
      autoClosingBrackets: 'always',
      autoClosingQuotes: 'always',
      suggestOnTriggerCharacters: true,
      acceptSuggestionOnEnter: 'on',
      tabCompletion: 'on',
      wordBasedSuggestions: false
    });

    // Set up change listener
    this.editor.onDidChangeModelContent(() => {
      if (this.onChangeCallback) {
        this.onChangeCallback(this.editor.getValue());
      }
    });

    // Register custom language definitions
    this.registerHandlebarsLanguage();
  }

  /**
   * Updates the editor content and adjusts the language mode based on the file type.
   * @param content - New source code string
   * @param fileType - File extension or type identifier
   */
  setEditorContent(content: string, fileType: string) {
    if (this.editor) {
      const language = this.getLanguageFromFileType(fileType);
      const model = monaco.editor.createModel(content, language);
      this.editor.setModel(model);
    }
  }

  /**
   * Sets the listener for editor content changes.
   * @param callback - Function to execute on every keystroke/change
   */
  setOnChangeCallback(callback: (value: string) => void) {
    this.onChangeCallback = callback;
  }

  /**
   * Maps file extensions to Monaco language identifiers.
   * @param fileType - Input extension
   * @returns Monaco compatible language ID
   */
  private getLanguageFromFileType(fileType: string): string {
    switch (fileType) {
      case 'hbs':
        return 'handlebars';
      case 'css':
      case 'scss':
        return 'css';
      case 'js':
        return 'javascript';
      case 'ts':
        return 'typescript';
      default:
        return 'html';
    }
  }

  /**
   * Configures a custom Monarch tokenizer for Handlebars specifically for Monaco.
   * Adds syntax highlighting for Handlebars tags and helpers.
   */
  private registerHandlebarsLanguage() {
    // Register Handlebars language for Monaco Editor
    if (monaco.languages.getLanguages().find((lang: any) => lang.id === 'handlebars')) {
      return; // Already registered
    }

    monaco.languages.register({ id: 'handlebars' });

    monaco.languages.setMonarchTokensProvider('handlebars', {
      tokenizer: {
        root: [
          [/\{\{\{/, { token: 'keyword', next: '@handlebars_unescaped' }],
          [/\{\{/, { token: 'keyword', next: '@handlebars' }],
          [/<!DOCTYPE/, 'metatag', '@doctype'],
          [/<!--/, 'comment', '@comment'],
          [/(<)(\w+)/, ['delimiter', { token: 'tag', next: '@tag' }]],
          [/(<\/)(\w+)/, ['delimiter', { token: 'tag', next: '@tag' }]],
          [/</, 'delimiter'],
          [/[^<]+/]
        ],

        handlebars_unescaped: [
          [/\}\}\}/, { token: 'keyword', next: '@pop' }],
          [/[^}]+/, 'variable']
        ],

        handlebars: [
          [/\}\}/, { token: 'keyword', next: '@pop' }],
          [/#if|#unless|#each|#with|\/if|\/unless|\/each|\/with/, 'keyword'],
          [/[a-zA-Z_][\w]*/, 'variable'],
          [/[^}]+/, 'variable']
        ],

        comment: [
          [/-->/, 'comment', '@pop'],
          [/[^-]+/, 'comment'],
          [/./, 'comment']
        ],

        doctype: [
          [/[^>]+/, 'metatag.content'],
          [/>/, 'metatag', '@pop']
        ],

        tag: [
          [/[ \t\r\n]+/, 'white'],
          [/(\w+)(\s*=\s*)("([^"]*)")/, ['attribute.name', 'delimiter', 'attribute.value', 'attribute.value']],
          [/(\w+)(\s*=\s*)('([^']*)')/, ['attribute.name', 'delimiter', 'attribute.value', 'attribute.value']],
          [/\w+/, 'attribute.name'],
          [/>/, 'delimiter', '@pop']
        ]
      }
    });

    monaco.languages.setLanguageConfiguration('handlebars', {
      comments: {
        blockComment: ['<!--', '-->']
      },
      brackets: [
        ['<', '>'],
        ['{{', '}}'],
        ['{{{', '}}}']
      ],
      autoClosingPairs: [
        { open: '<', close: '>' },
        { open: '{{', close: '}}' },
        { open: '{{{', close: '}}}' },
        { open: '"', close: '"' },
        { open: "'", close: "'" }
      ],
      surroundingPairs: [
        { open: '<', close: '>' },
        { open: '{{', close: '}}' },
        { open: '{{{', close: '}}}' },
        { open: '"', close: '"' },
        { open: "'", close: "'" }
      ]
    });
  }

  /**
   * Disposes of the editor instance and releases resources.
   */
  destroy() {
    if (this.editor) {
      this.editor.dispose();
      this.editor = null;
    }
  }
}
