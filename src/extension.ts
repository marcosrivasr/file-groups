// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { NodeDependenciesProvider } from "./dataprovider";
import { GroupsDataProvider, TabItem, GroupItem } from "./groupsDataProvider";
import { commands } from "./constants/commands";

let tabsGroups: GroupsDataProvider;

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "group-tabs" is now active!');

  tabsGroups = new GroupsDataProvider(vscode.workspace.rootPath!, context);

  vscode.window.registerTreeDataProvider("fileGroups", tabsGroups);

  const disposables = [
    vscode.commands.registerCommand("group-tabs.say", async () => {
      let what = await vscode.window.showInputBox({ placeHolder: "cow say?" });
      if (what) {
        let uri = vscode.Uri.parse("cowsay:" + what);
        let doc = await vscode.workspace.openTextDocument(uri); // calls back into the provider
        await vscode.window.showTextDocument(doc, { preview: false });
      }
    }),
    vscode.commands.registerCommand("group-tabs.helloWorld", () => {
      vscode.window.showInformationMessage("Hello World!");
    }),

    vscode.commands.registerCommand(commands.add, async () => {
      let name = await vscode.window.showInputBox({
        placeHolder: "Name of the group",
      });
      if (name) {
        if (tabsGroups.existsGroup(name)) {
          vscode.window.showInformationMessage(`Ya existe el grupo ${name}`);
        } else {
          tabsGroups.createNewGroup(name);

          vscode.window.showInformationMessage(`Se añadió el grupo ${name}`);
        }
      } else {
        return;
      }
    }),

    vscode.commands.registerCommand(commands.click, (item: TabItem) => {
      vscode.window.showInformationMessage(`Click al elemento ${item.label}`);
    }),

    vscode.commands.registerCommand(commands.openFile, (item: TabItem) => {
      vscode.window.showInformationMessage(`Click al elemento ${item.label}`);
    }),

    vscode.commands.registerCommand(commands.deleteGroup, (item: GroupItem) => {
      tabsGroups.deleteGroup(item);
    }),
  ];

  //context.subscriptions.push(disposable);
  context.subscriptions.concat(disposables);
}

// this method is called when your extension is deactivated
export function deactivate() {}
