import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { wait, Tab, createTab } from "./util";
import { basename } from "path";
import { commands } from "./constants/commands";

enum TreeItemType {
  GroupItem,
  ColumnItem,
  TabItem,
}

export class GroupsDataProvider implements vscode.TreeDataProvider<TreeItem> {
  groups: GroupItem[] = [];
  currentGroup?: GroupItem = undefined;
  context: vscode.ExtensionContext | null;

  constructor(private workspaceRoot: string, context: vscode.ExtensionContext) {
    this.context = context;

    if (this.context.workspaceState.get("groups")) {
      const base64 = <string>this.context.workspaceState.get("groups");
      const decoded = Buffer.from(base64, "base64").toString("ascii");
      try {
        // Try to use the decoded base64
        this.groups = JSON.parse(decoded);
      } catch {
        console.log("Was not able to parse decoded Base64 as Json");
      } // Base64 decoded was not valid
    } else {
      console.log("No hay nada guardado");
    }
  }

  private _onDidChangeTreeData = new vscode.EventEmitter<
    TreeItem | undefined
  >();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  async getChildren(
    element?: TreeItem
  ): Promise<TreeItem[] | null | undefined> {
    if (element) {
      if (element.type === TreeItemType.GroupItem) {
        return Promise.resolve((element as GroupItem).columns);
      } else if (element.type === TreeItemType.ColumnItem) {
        return Promise.resolve((element as ColumnItem).tabs);
      }
    } else {
      return Promise.resolve(this.groups);
    }
  }

  getTreeItem(element: TreeItem): vscode.TreeItem {
    if (element.type === TreeItemType.TabItem) {
      element.command = {
        command: commands.openFile,
        title: "Open file",
        arguments: [(element as TabItem).textEditor],
      };
    }
    return element;
  }

  async createNewGroup(name: string) {
    const newGroup = new GroupItem(name, name, name);
    await newGroup.create();
    this.groups.push(newGroup);
    this.currentGroup = newGroup;
    this.saveGroups();
  }

  /**
   * Save the groups to the workspace state
   */
  saveGroups() {
    const workspaceState = this.context!.workspaceState;
    const encoded = Buffer.from(JSON.stringify(this.groups)).toString("base64");
    workspaceState.update("groups", encoded);

    this.refresh();
  }

  /**
   * It emits the onDidChangeTreeData event to update the tree view
   */
  refresh() {
    this._onDidChangeTreeData.fire(undefined);
  }

  existsGroup(name: string): boolean {
    return this.groups.find((group) => group.label === name) !== undefined;
  }

  deleteGroup(item: GroupItem) {
    this.groups = this.groups.filter((group) => group.id !== item.id);
    this.saveGroups();
  }

  getListOfGroups(): readonly string[] {
    return this.groups.map((group) => group.label);
  }

  addFileToGroup(groupName: string, activeTextEditor: vscode.TextEditor) {
    const group = this.groups.find((group) => group.label === groupName);

    if (group) {
      group.addFile(activeTextEditor);
      this.saveGroups();
    }
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
}

export class GroupItem extends TreeItem {
  columns: ColumnItem[] = [];

  constructor(
    public readonly id: string,
    public readonly label: string,
    public readonly tooltip: string,
    public readonly isFromBranch: boolean = false
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
    light: path.join(
      __filename,
      "..",
      "..",
      "resources",
      "light",
      "folder.svg"
    ),
    dark: path.join(__filename, "..", "..", "resources", "dark", "folder.svg"),
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
        column.tabs.push(new TabItem(tabId, filename, tabId, activeTextEditor));
      } else {
        break;
      }

      await vscode.commands.executeCommand("workbench.action.nextEditor");
      await wait(500);

      activeTextEditor = vscode.window.activeTextEditor;
    }

    return this.columns;
  }

  addFile(textEditor: vscode.TextEditor) {
    const column = this.columns.find(
      (item) => item.id === `${this.id}-${textEditor.viewColumn}`
    );
    if (column) {
      column.addTab(textEditor);
    }
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

  addTab(textEditor: vscode.TextEditor) {
    const tabId = `${this.id}-${basename(textEditor.document.fileName)}`;
    const existsTab = this.tabs.find((item) => item.id === tabId);
    if (!existsTab) {
      this.tabs.push(
        new TabItem(tabId, textEditor.document.fileName, tabId, textEditor)
      );
    } else {
      vscode.window.showErrorMessage(
        `The file ${textEditor.document.fileName} is already open in this column`
      );
    }
  }
}

export class TabItem extends TreeItem {
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
