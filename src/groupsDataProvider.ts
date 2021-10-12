import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { wait, Tab, createTab } from "./util";
import { basename } from "path";
const util = require("util");
let exec = require("child_process").exec;

enum TreeItemType {
  GroupItem,
  ColumnItem,
  TabItem,
}

export class GroupsDataProvider implements vscode.TreeDataProvider<TreeItem> {
  groups: GroupItem[] = [];

  constructor(private workspaceRoot: string) {}

  private _onDidChangeTreeData = new vscode.EventEmitter<
    TreeItem | undefined
  >();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  async getChildren(
    element?: TreeItem
  ): Promise<TreeItem[] | null | undefined> {
    if (element) {
      if (element.type === TreeItemType.GroupItem) {
        /**
         * 1. obtener los elementos y acomodarlos de acuerdo a su columna
         */
        let res: ColumnItem[] = [];
        let columns: ColumnItem[];
        try {
          columns = await (element as GroupItem).create();
        } catch (error) {
          return Promise.resolve([]);
        }
        res.push(...columns);
        /*
        for (let i = 0; i < 10; i++) {
          const name = `${element.label}_${i}`;
          res.push(new ColumnItem(name, name, name));
        } */
        return Promise.resolve(res);
      } else if (element.type === TreeItemType.ColumnItem) {
        return Promise.resolve((element as ColumnItem).tabs);
      }
    } else {
      console.log(this.groups);
      return Promise.resolve(this.groups);
    }
  }

  getTreeItem(element: TreeItem): vscode.TreeItem {
    return element;
  }

  addGroup(name: string) {
    const currentGroup = this.groups.push(new GroupItem(name, name, name));
    console.log(currentGroup);
    this.refresh();
  }

  refresh() {
    this._onDidChangeTreeData.fire(undefined);
  }

  existsGroup(name: string): boolean {
    return this.groups.find((group) => group.label === name) !== undefined;
  }
}

/**
 * Base class for tree items
 */
class TreeItem extends vscode.TreeItem {
  constructor(
    public readonly id: string,
    public readonly label: string,
    public readonly tooltip: string,
    public readonly type: TreeItemType,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly contextValue: string
  ) {
    super(label, collapsibleState);

    this.contextValue = contextValue;
    this.id = id;
    this.description = tooltip;
    this.tooltip = `${this.tooltip}`;
  }

  iconPath = {
    light: path.join(__filename, "..", "..", "resources", "light", "tab.svg"),
    dark: path.join(__filename, "..", "..", "resources", "dark", "tab.svg"),
  };
}

class GroupItem extends TreeItem {
  private columns: ColumnItem[] = [];

  constructor(
    public readonly id: string,
    public readonly label: string,
    public readonly tooltip: string
  ) {
    super(
      id,
      label,
      tooltip,
      TreeItemType.GroupItem,
      vscode.TreeItemCollapsibleState.Expanded,
      "group"
    );
  }

  iconPath = {
    light: path.join(__filename, "..", "..", "resources", "dark", "folder.svg"),
    dark: path.join(__filename, "..", "..", "resources", "light", "folder.svg"),
  };

  async create(): Promise<ColumnItem[]> {
    let activeTextEditor = vscode.window.activeTextEditor;

    if (!activeTextEditor) return [];

    while (activeTextEditor) {
      //1. obtener activeTextEditor e info
      const filename = activeTextEditor.document.fileName;
      const columnId = `${this.id}-${activeTextEditor.viewColumn}`;
      const columnLabel = `Column ${activeTextEditor.viewColumn}`;

      //2. validar si ya existe una columna
      let column = this.columns.find((item) => item.id === columnId);

      //3. si ya existe una columan meter el activeTextEditor
      if (!column) {
        //4. si no existe una columna crear la columna y meter el activeTextEditor
        column = new ColumnItem(columnId, columnLabel, columnId);
        this.columns.push(column);
      }

      const tabId = `${columnId}-${basename(filename)}`;
      const existsTab = column.tabs.find((item) => item.id === tabId);
      if (!existsTab) {
        column.tabs.push(new TabItem(tabId, filename, tabId));
      } else {
        break;
      }

      await vscode.commands.executeCommand("workbench.action.nextEditor");
      await wait(1000);

      activeTextEditor = vscode.window.activeTextEditor;
    }

    return this.columns;
  }
}
class ColumnItem extends TreeItem {
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
    light: path.join(__filename, "..", "..", "resources", "dark", "column.svg"),
    dark: path.join(__filename, "..", "..", "resources", "light", "column.svg"),
  };
}

export class TabItem extends TreeItem {
  filename: string;

  constructor(
    public readonly id: string,
    public readonly fileUrl: string,
    public readonly tooltip: string
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
    this.command = {
      command: "fileGroups.click",
      title: "",
      arguments: [this],
    };
  }

  iconPath = {
    light: path.join(__filename, "..", "..", "resources", "light", "group.svg"),
    dark: path.join(__filename, "..", "..", "resources", "dark", "group.svg"),
  };
}
