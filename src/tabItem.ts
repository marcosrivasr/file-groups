import * as vscode from "vscode";
import * as path from "path";
import { basename } from "path";
import TreeItem from "./treeItem";
import { TreeItemType } from "./types/types";

export default class TabItem extends TreeItem {
  filename: string;
  textEditor: vscode.TextEditor;

  constructor(
    public readonly id: string,
    public readonly fileUrl: string,
    public readonly tooltip: string,
    textEditor: vscode.TextEditor
  ) {
    super(
      id,
      basename(fileUrl),
      tooltip,
      TreeItemType.TabItem,
      vscode.TreeItemCollapsibleState.None,
      "tab"
    );
    this.filename = fileUrl;
    this.textEditor = textEditor;
  }

  iconPath = {
    light: path.join(__filename, "..", "..", "resources", "light", "group.svg"),
    dark: path.join(__filename, "..", "..", "resources", "dark", "group.svg"),
  };
}
