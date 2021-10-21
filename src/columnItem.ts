import * as vscode from "vscode";
import * as path from "path";
import { basename } from "path";
import TreeItem from "./treeItem";
import TabItem from "./tabItem";

import { TreeItemType } from "./types/types";

export default class ColumnItem extends TreeItem {
  public tabs: TabItem[] = [];
  constructor(
    public readonly id: string,
    public readonly label: string,
    public readonly tooltip: string
  ) {
    super(
      id,
      label,
      tooltip,
      TreeItemType.ColumnItem,
      vscode.TreeItemCollapsibleState.Collapsed,
      "column"
    );
  }

  iconPath = {
    light: path.join(
      __filename,
      "..",
      "..",
      "resources",
      "light",
      "column.svg"
    ),
    dark: path.join(__filename, "..", "..", "resources", "dark", "column.svg"),
  };

  addTab(textEditor: vscode.TextEditor): boolean {
    const tabId = `${this.id}-${basename(textEditor.document.fileName)}`;
    const existsTab = this.tabs.find((item) => item.id === tabId);
    if (!existsTab) {
      this.tabs.push(
        new TabItem(tabId, textEditor.document.fileName, "", textEditor)
      );
      return true;
    } else {
      vscode.window.showErrorMessage(
        `The file ${textEditor.document.fileName} is already open in this column`
      );
    }

    return false;
  }

  deleteTab(textEditor: vscode.TextEditor) {
    const tab = this.tabs.find(
      (item) =>
        item.textEditor.document.fileName === textEditor.document.fileName
    );
    if (tab) {
      this.tabs = this.tabs.filter((item) => item !== tab);
    }
  }
}
