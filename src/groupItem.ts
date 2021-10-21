import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { basename } from "path";
import TreeItem from "./treeItem";
import ColumnItem from "./columnItem";
import TabItem from "./tabItem";

import { TreeItemType } from "./types/types";

export default class GroupItem extends TreeItem {
  columns: ColumnItem[] = [];

  constructor(
    public readonly id: string,
    public readonly label: string,
    public readonly tooltip: string,
    public readonly gitRepo: boolean
  ) {
    super(
      id,
      label,
      tooltip,
      TreeItemType.GroupItem,
      vscode.TreeItemCollapsibleState.Expanded,
      "group"
    );

    if (gitRepo) {
      this.iconPath = {
        light: path.join(__filename, "..", "..", "resources", "git.svg"),
        dark: path.join(__filename, "..", "..", "resources", "git.svg"),
      };
    } else {
      this.iconPath = {
        light: path.join(
          __filename,
          "..",
          "..",
          "resources",
          "light",
          "folder.svg"
        ),
        dark: path.join(
          __filename,
          "..",
          "..",
          "resources",
          "dark",
          "folder.svg"
        ),
      };
    }
  }

  async create(): Promise<ColumnItem[]> {
    let activeTextEditor = vscode.window.activeTextEditor;

    if (!activeTextEditor) return [];
    let count = 0;
    while (activeTextEditor) {
      if (
        !activeTextEditor.document.isUntitled ||
        fs.existsSync(activeTextEditor.document.fileName)
      ) {
        //1. obtener activeTextEditor e info
        const filename = activeTextEditor.document.fileName;
        const columnId = `${this.id}-${activeTextEditor.viewColumn}`;
        const columnLabel = `Column ${activeTextEditor.viewColumn}`;

        //2. validar si ya existe una columna
        let column = this.columns.find((item) => item.id === columnId);

        //3. si ya existe una columan meter el activeTextEditor
        if (!column) {
          //4. si no existe una columna crear la columna y meter el activeTextEditor
          column = new ColumnItem(columnId, columnLabel, "");
          this.columns.push(column);
        }

        const tabId = `${columnId}-${basename(filename)}`;
        const existsTab = column.tabs.find((item) => item.id === tabId);
        if (!existsTab) {
          column.tabs.push(new TabItem(tabId, filename, "", activeTextEditor));
          count++;
        } else {
          break;
        }
      }
      await vscode.commands.executeCommand("workbench.action.nextEditor");
      //await wait(500);
      activeTextEditor = vscode.window.activeTextEditor;
    }
    return this.columns;
  }

  addFile(textEditor: vscode.TextEditor): boolean {
    let res = false;
    const column = this.columns.find(
      (item) => item.id === `${this.id}-${textEditor.viewColumn}`
    );
    if (column) {
      res = column.addTab(textEditor);
    }
    return res;
  }

  deleteTab(columnId: string, textEditor: vscode.TextEditor) {
    const column = this.columns.find(
      (item) => item.label === `Column ${columnId}`
    );
    if (column) {
      column.deleteTab(textEditor);
    }
  }
}
