import * as vscode from "vscode";

import { TreeItemType } from "./types/types";

/**
 * Base class for tree items
 */
export default class TreeItem extends vscode.TreeItem {
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
