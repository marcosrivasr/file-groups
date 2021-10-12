import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { wait, Tab, createTab } from "./util";
const util = require("util");
let exec = require("child_process").exec;

export class TabsGroupsDataProvider
  implements vscode.TreeDataProvider<TreeItem>
{
  groups: number[] = [];
  tabs: Tab[] = [];

  constructor(private workspaceRoot: string) {}

  onDidChangeTreeData?:
    | vscode.Event<void | TreeItem | null | undefined>
    | undefined;

  getChildren(element?: TreeItem): vscode.ProviderResult<TreeItem[]> {
    return Promise.resolve([]);
  }

  getTreeItem(element: TreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren2(
    element?: TreeItem
  ): Promise<TreeItem[] | null | undefined> {
    console.log("workspaceRoot", this.workspaceRoot);

    if (!this.workspaceRoot) {
      vscode.window.showInformationMessage("Empty workspace");
      return Promise.resolve([]);
    }
    //active textEditor
    let active = vscode.window.activeTextEditor;
    //Si no hay active editor no regresamos nada
    if (!active) {
      return Promise.resolve([]);
    }
    // creamos el tab actual
    let currentTab: Tab = createTab(active);
    // arreglo de grupos
    const openEditors: vscode.TextEditor[] = [];
    //cuando se expande un elemento
    if (element) {
      console.log({ element });
      const id = parseInt(element.id);
      const items = this.tabs
        .filter((tab) => tab.group === id)
        .map((tab) => {
          return new TreeItem(
            tab.id,
            path.basename(tab.textEditor.document.fileName),
            tab.textEditor.document.fileName,
            vscode.TreeItemCollapsibleState.None
          );
        });

      return Promise.resolve(items);
    } else {
      while (currentTab) {
        console.log(currentTab.textEditor.document.fileName);

        this.tabs.push(currentTab);

        await vscode.commands.executeCommand("workbench.action.nextEditor");
        await wait(1000);

        currentTab = createTab(vscode.window.activeTextEditor!);

        const found = this.tabs.find((t) => t.id === currentTab.id);

        if (found) break;
      }

      const res: TreeItem[] = [];
      this.groups = this.tabs.map((tab) => parseInt(tab.id));
      this.groups = [...new Set(this.groups)];

      this.groups.forEach((group) => {
        const d = new TreeItem(
          group.toString(),
          `Group ${group}`,
          `Group ${group}`,
          vscode.TreeItemCollapsibleState.Collapsed
        );

        res.push(d);
      });

      /* for (let i = 0; i < openEditors.length; i++) {
        const d = new TreeItem(
          path.basename(openEditors[i].document.fileName),
          openEditors[i].document.fileName,
          vscode.TreeItemCollapsibleState.Collapsed
        );

        res.push(d);
      } */
      return Promise.resolve(res);
    }
  }
}

class TreeItem extends vscode.TreeItem {
  constructor(
    public readonly id: string,
    public readonly label: string,
    public readonly tooltip: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(label, collapsibleState);
    this.id = id;
    this.tooltip = `${this.tooltip}`;
    this.command = {
      command: "group-tabs.say",
      title: "",
    };
  }

  iconPath = {
    light: path.join(__filename, "..", "..", "resources", "light", "tab.svg"),
    dark: path.join(__filename, "..", "..", "resources", "dark", "tab.svg"),
  };
}
