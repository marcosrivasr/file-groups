// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { GroupsDataProvider } from "./groupsDataProvider";
import { commands } from "./constants/commands";
import { API, GitErrorCodes, GitExtension } from "./types/git";
import GroupItem from "./groupItem";
import TabItem from "./tabItem";
import { TreeItemType } from "./types/types";

let fileGroups: GroupsDataProvider;
const gitExtension =
  vscode.extensions.getExtension<GitExtension>("vscode.git")!.exports;
const git = gitExtension.getAPI(1);
let isRepository = false;
let currentBranch: string | undefined;

export async function activate(context: vscode.ExtensionContext) {
  try {
    git.onDidChangeState(async (e) => {
      if (e === "initialized" && git.repositories.length > 0) {
        git.repositories[0].state.onDidChange(() => {
          const newBranch = git.repositories[0].state.HEAD?.name;
          if (newBranch !== currentBranch) {
            console.log("Change of branch");
            currentBranch = newBranch;
            fileGroups.changeGroup(newBranch!);
          }
          isRepository = true;
        });
      }
    });
  } catch (gitExtensionError) {
    console.log("Git Extension Error", gitExtensionError);
  }

  fileGroups = new GroupsDataProvider(vscode.workspace.rootPath!, context);

  vscode.window.registerTreeDataProvider("fileGroups", fileGroups);

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
  console.log("Git state", git.state);
  console.log("Number of repositories", git.repositories.length);
  console.log(
    "There is at least one repository",
    git.repositories[0].state.HEAD?.name
  );

  if (git.repositories.length > 0) {
    isRepository = true;
    currentBranch = git.repositories[0].state.HEAD!.name;
  }

  let branch = "";
  if (isRepository) {
    branch = currentBranch ?? "";
  }

  let name = await vscode.window.showInputBox({
    title: "Name of the group",
    placeHolder: "Name of the group",
    value: branch,
  });

  if (name && name.trim() !== "") {
    name = name.trim();
    if (fileGroups.existsGroup(name)) {
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
          fileGroups.createNewGroup(name, true);
          vscode.window.showInformationMessage(`New group added: ${name}`);
        } else {
          fileGroups.createNewGroup(name);
          vscode.window.showInformationMessage(`New group added: ${name}`);
        }
      } else {
        fileGroups.createNewGroup(name);
        vscode.window.showInformationMessage(`New group added: ${name}`);
      }
    }
  } else {
    return;
  }
}

async function openFile(editor: vscode.TextEditor) {
  try {
    if (editor.document.isUntitled) {
    } else {
      await vscode.window.showTextDocument(editor.document, {
        preview: false,
        viewColumn: editor.viewColumn,
        selection: editor.selection,
      });
    }
  } catch (e) {
    console.log("Open File Error Exception", e);
  }
}

function deleteGroup(item: GroupItem) {
  fileGroups.deleteGroup(item);
}

function openGroup(item: GroupItem) {
  fileGroups.openGroup(item);
}

async function addCurrentFile() {
  if (vscode.window.activeTextEditor?.document.isUntitled) {
    vscode.window.showInformationMessage(
      `Untitled files cannot be saved into a group`
    );
    return;
  }
  let option = await vscode.window.showQuickPick(fileGroups.getListOfGroups());
  if (option) {
    fileGroups.addFileToGroup(option, vscode.window.activeTextEditor!);
  }
}

function refreshGroups() {
  fileGroups.refresh();
}

function deleteEntry(item: TabItem) {
  fileGroups.deleteTab(item);
}

// this method is called when your extension is deactivated
export function deactivate() {}
