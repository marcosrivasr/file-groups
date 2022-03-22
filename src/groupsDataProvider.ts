import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { wait, Tab, createTab } from "./util";
import { basename } from "path";
import { commands } from "./constants/commands";
import GroupItem from "./groupItem";
import TreeItem from "./treeItem";
import TabItem from "./tabItem";
import ColumnItem from "./columnItem";
import { TreeItemType } from "./types/types";

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
        const json = JSON.parse(decoded) as GroupItem[];
        const openedGroups = json.map((g) => {
          const instanceGroup = new GroupItem("", "", "", false);
          Object.assign(instanceGroup, g);

          const cols = instanceGroup.columns.map((c, i) => {
            const instanceColumn = new ColumnItem("", "", "");
            Object.assign(instanceColumn, g.columns[i]);
            return instanceColumn;
          });
          instanceGroup.columns = [...cols];

          return instanceGroup;
        });
        this.groups = [...openedGroups];
      } catch {
        console.log("Was not able to parse decoded Base64 as Json");
      } // Base64 decoded was not valid
    } else {
      console.log("Nothing saved");
      this.groups = [];
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
      const tab = element as TabItem;
      element.command = {
        command: commands.openFile,
        title: "Open file",
        arguments: [tab.textEditor],
      };
    }
    return element;
  }

  async createNewGroup(name: string, gitRepo: boolean = false) {
    const newGroup = new GroupItem(name, name, "", gitRepo);
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
    const group: GroupItem | undefined = this.groups.find(
      (group) => group.label === groupName
    );

    if (group) {
      if (group.addFile(activeTextEditor)) {
        // update the tree view
        this.saveGroups();
      }
    }
  }

  changeGroup(id: string) {
    const group = this.groups.find((group) => group.id === id);

    if (group && group.gitRepo) {
      this.openGroup(group);
    }
  }

  async openGroup(group: GroupItem) {
    //close all editors
    await vscode.commands.executeCommand("workbench.action.closeAllEditors");

    group.columns.forEach((column) => {
      column.tabs.forEach(async (tab) => {
        const editor = tab.textEditor;
        try {
          if (
            !editor.document.isUntitled ||
            fs.existsSync(editor.document.fileName)
          ) {
            await vscode.window.showTextDocument(editor.document, {
              preview: false,
              viewColumn: editor.viewColumn,
              selection: editor.selection,
            });
          } else {
            //the file is Untitled or doesn't exist
          }
        } catch (e) {
          console.log("error", e);
        }
      });
    });
  }

  deleteTab(item: TabItem) {
    const id = item.id;

    this.groups.forEach((group) => {
      group.columns.forEach((column) => {
        column.tabs = column.tabs.filter((tab) => tab.id !== id);
      });
    });

    this.saveGroups();
  }
}
