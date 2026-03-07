import * as vscode from 'vscode';

export class Logger {
  private outputChannel: vscode.OutputChannel;

  constructor(channelName: string) {
    this.outputChannel = vscode.window.createOutputChannel(channelName);
  }

  info(message: string): void {
    const timestamp = new Date().toISOString();
    this.outputChannel.appendLine(`[${timestamp}] [INFO] ${message}`);
  }

  warn(message: string): void {
    const timestamp = new Date().toISOString();
    this.outputChannel.appendLine(`[${timestamp}] [WARN] ${message}`);
  }

  error(message: string, error?: unknown): void {
    const timestamp = new Date().toISOString();
    this.outputChannel.appendLine(`[${timestamp}] [ERROR] ${message}`);
    if (error) {
      if (error instanceof Error) {
        this.outputChannel.appendLine(`  ${error.message}`);
      } else if (typeof error === 'string') {
        this.outputChannel.appendLine(`  ${error}`);
      } else {
        try {
          this.outputChannel.appendLine(`  ${JSON.stringify(error)}`);
        } catch {
          this.outputChannel.appendLine(`  [Unable to stringify error]`);
        }
      }
    }
  }

  dispose(): void {
    this.outputChannel.dispose();
  }
}
