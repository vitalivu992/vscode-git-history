import * as vscode from 'vscode';
import { getFileContentAtCommit } from './git/gitService';

export class GitHistoryContentProvider implements vscode.TextDocumentContentProvider {
  static readonly scheme = 'git-history';

  provideTextDocumentContent(uri: vscode.Uri): Thenable<string> {
    const params = new URLSearchParams(uri.query);
    const commit = params.get('commit') || '';
    const cwd = params.get('cwd') || '';
    const filePath = uri.path.startsWith('/') ? uri.path.slice(1) : uri.path;

    return getFileContentAtCommit(filePath, commit, cwd);
  }
}
