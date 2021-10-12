// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { NodeDependenciesProvider } from "./dataprovider";
import { TabsGroupsDataProvider } from "./tabsGroupsDataProvider";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "group-tabs" is now active!');

  /* vscode.window.registerTreeDataProvider(
    "fileGroups",
    new TabsGroupsDataProvider(vscode.workspace.rootPath!)
  ); */

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
      // The code you place here will be executed every time your command is executed
      // Display a message box to the user
      vscode.window.showInformationMessage("Hello World!");
    }),

    vscode.commands.registerCommand("fileGroups.addEntry", async () => {
      let what = await vscode.window.showInputBox({
        placeHolder: "Nombre del grupo",
      });
      vscode.window.showInformationMessage(`${what}`);

      vscode.window.registerTreeDataProvider(
        "fileGroups",
        new TabsGroupsDataProvider(vscode.workspace.rootPath!)
      );
    }),
  ];

  //context.subscriptions.push(disposable);
  context.subscriptions.concat(disposables);
}

// this method is called when your extension is deactivated
export function deactivate() {}
