// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { NodeDependenciesProvider } from "./dataprovider";
import { GroupsDataProvider, TabItem, GroupItem } from "./groupsDataProvider";
import { commands } from "./constants/commands";
import { API, GitErrorCodes, GitExtension } from "./types/git";

let tabsGroups: GroupsDataProvider;
let git: API;
let isRepository = false;
let currentBranch: string | undefined;

export async function activate(context: vscode.ExtensionContext) {
  await vscode.extensions.getExtension("vscode.git")?.activate();
  const gitExtension =
    vscode.extensions.getExtension<GitExtension>("vscode.git")!.exports;
  git = gitExtension.getAPI(1);

  git.onDidChangeState(async (e) => {
    if (e === "initialized") {
      try {
        currentBranch = await git.repositories[0].state.HEAD!.name;
        isRepository = true;

        git.repositories[0].state.onDidChange(async () => {
          try {
            const newBranch = await git.repositories[0].state.HEAD?.name;
            if (newBranch !== currentBranch) {
              console.log("Change of branch");
              currentBranch = newBranch;
              tabsGroups.changeGroup(newBranch!);
            }
            isRepository = true;
          } catch (error) {
            isRepository = false;
          }
        });
      } catch (error) {
        isRepository = false;
      }
    }
  });

  tabsGroups = new GroupsDataProvider(vscode.workspace.rootPath!, context);

  vscode.window.registerTreeDataProvider("fileGroups", tabsGroups);

  const disposables = [
    vscode.commands.registerCommand(commands.add, addNewGroup),
    vscode.commands.registerCommand(commands.openFile, openFile),
    vscode.commands.registerCommand(commands.deleteGroup, deleteGroup),
    vscode.commands.registerCommand(commands.openGroup, openGroup),
    vscode.commands.registerCommand(commands.addCurrentFile, addCurrentFile),
    vscode.commands.registerCommand(commands.refreshGroups, refreshGroups),
    vscode.commands.registerCommand(commands.deleteEntry, deleteEntry),
  ];

  context.subscriptions.concat(disposables);
}

async function addNewGroup() {
  let branch = "";
  if (isRepository) {
    branch = (await git.repositories[0].state.HEAD?.name) || "";
  }

  let name = await vscode.window.showInputBox({
    title: "Name of the group",
    placeHolder: "Name of the group",
    value: branch,
  });
  if (name && name.trim() !== "") {
    name = name.trim();
    if (tabsGroups.existsGroup(name)) {
      vscode.window.showInformationMessage(
        `The group ${name} already exists, choose another name`
      );
    } else {
      if (branch === name) {
        const options = ["Yes", "No"];
        let confirm = await vscode.window.showQuickPick(options, {
          canPickMany: false,
          title:
            "(Git): Do you want to link this group with the current branch? (yes/no)",
        });

        if (confirm?.trim().toLowerCase() === "yes") {
          tabsGroups.createNewGroup(name, true);
          vscode.window.showInformationMessage(`New group added: ${name}`);
        } else {
          tabsGroups.createNewGroup(name);
          vscode.window.showInformationMessage(`New group added: ${name}`);
        }
      } else {
        tabsGroups.createNewGroup(name);
        vscode.window.showInformationMessage(`New group added: ${name}`);
      }
    }
  } else {
    return;
  }
}

async function openFile(editor: vscode.TextEditor) {
  try {
    await vscode.window.showTextDocument(editor.document, {
      preview: false,
      viewColumn: editor.viewColumn,
      selection: editor.selection,
    });
  } catch (e) {
    console.log("error", e);
  }
}

function deleteGroup(item: GroupItem) {
  tabsGroups.deleteGroup(item);
}

function openGroup(item: GroupItem) {
  tabsGroups.openGroup(item);
}

async function addCurrentFile() {
  let option = await vscode.window.showQuickPick(tabsGroups.getListOfGroups());
  if (option) {
    tabsGroups.addFileToGroup(option, vscode.window.activeTextEditor!);
  }
}

function refreshGroups() {
  tabsGroups.refresh();
}

function deleteEntry(item: TabItem) {
  tabsGroups.deleteTab(item);
}

// this method is called when your extension is deactivated
export function deactivate() {}
