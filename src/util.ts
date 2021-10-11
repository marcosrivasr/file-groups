import { TextEditor } from "vscode";
import * as vscode from "vscode";

export interface Tab {
  id: string;
  group: number;
  textEditor: vscode.TextEditor;
}

export function wait(time: number) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve(true);
    }, time);
  });
}

export function createTab(textEditor: TextEditor): Tab {
  return {
    id: textEditor.viewColumn + "-" + textEditor.document.fileName,
    group: textEditor.viewColumn!,
    textEditor: textEditor,
  };
}
