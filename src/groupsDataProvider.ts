import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { wait, Tab, createTab } from "./util";
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

  getChildren(element?: TreeItem): vscode.ProviderResult<TreeItem[]> {
    if (element) {
      if (element.type === TreeItemType.GroupItem) {
        let res: TreeItem[] = [];
        for (let i = 0; i < 10; i++) {
          const name = `${element.label}_${i}`;
          res.push(new ColumnItem(name, name, name));
        }
        return Promise.resolve(res);
      } else if (element.type === TreeItemType.ColumnItem) {
        let res: TreeItem[] = [];
        for (let i = 0; i < 10; i++) {
          const name = `${element.label}_${i}`;
          res.push(new TabItem(name, name, name));
        }
        return Promise.resolve(res);
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
    this._onDidChangeTreeData.fire(undefined);
  }

  existsGroup(name: string): boolean {
    return this.groups.find((group) => group.label === name) !== undefined;
  }
}

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
    this.tooltip = `${this.tooltip}`;
    this.command = {
      command: "fileGroups.click",
      title: "",
      arguments: [this],
    };
  }

  iconPath = {
    light: path.join(__filename, "..", "..", "resources", "light", "tab.svg"),
    dark: path.join(__filename, "..", "..", "resources", "dark", "tab.svg"),
  };
}

class GroupItem extends TreeItem {
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
      vscode.TreeItemCollapsibleState.Collapsed,
      "group"
    );
  }

  iconPath = {
    light: path.join(__filename, "..", "..", "resources", "dark", "folder.svg"),
    dark: path.join(__filename, "..", "..", "resources", "light", "folder.svg"),
  };
}
class ColumnItem extends TreeItem {
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

class TabItem extends TreeItem {
  constructor(
    public readonly id: string,
    public readonly label: string,
    public readonly tooltip: string
  ) {
    super(
      id,
      label,
      tooltip,
      TreeItemType.TabItem,
      vscode.TreeItemCollapsibleState.None,
      "tab"
    );
    const url = path.join(
      __filename,
      "..",
      "..",
      "resources",
      "light",
      "group.svg"
    );
    console.log(url);
  }

  iconPath = {
    light: path.join(__filename, "..", "..", "resources", "light", "group.svg"),
    dark: path.join(__filename, "..", "..", "resources", "dark", "group.svg"),
  };
}
