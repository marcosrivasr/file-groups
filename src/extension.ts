// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { NodeDependenciesProvider } from "./dataprovider";
import { GroupsDataProvider, TabItem, GroupItem } from "./groupsDataProvider";
import { commands } from "./constants/commands";
import { API, GitErrorCodes, GitExtension } from "./types/git";

let tabsGroups: GroupsDataProvider;
let git: API;

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "group-tabs" is now active!');

  await vscode.extensions.getExtension("vscode.git")?.activate();
  const gitExtension =
    vscode.extensions.getExtension<GitExtension>("vscode.git")!.exports;
  git = gitExtension.getAPI(1);
  git.onDidChangeState((e) => {
    if (e === "initialized") {
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
  ];

  //context.subscriptions.push(disposable);
  context.subscriptions.concat(disposables);
}

async function addNewGroup() {
  const branch = (await git.repositories[0].state.HEAD?.name) || "";
  let name = await vscode.window.showInputBox({
    title: "Name of the group",
    placeHolder: "Name of the group",
    value: branch,
  });
  if (name) {
    if (tabsGroups.existsGroup(name)) {
      vscode.window.showInformationMessage(
        `The group ${name} already exists, choose another name`
      );
    } else {
      if (branch === name) {
        let confirm = await vscode.window.showInputBox({
          title:
            "(Git): Do you want to link this group with the current branch? (yes/no)",
          placeHolder: "yes",
          value: "yes",
        });

        if (confirm?.trim().toLowerCase() === "yes") {
        } else {
          //tabsGroups.createNewGroup(name);
          //vscode.window.showInformationMessage(`New group added: ${name}`);
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

function openGroup() {}

async function addCurrentFile() {
  let option = await vscode.window.showQuickPick(tabsGroups.getListOfGroups());
  if (option) {
    tabsGroups.addFileToGroup(option, vscode.window.activeTextEditor!);
  }
}

function refreshGroups() {
  tabsGroups.refresh();
}

// this method is called when your extension is deactivated
export function deactivate() {}
