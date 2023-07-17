import * as vscode from "vscode";

type QSChoice = "off" | "on" | "inline";

interface TeacherSettings {
  ["editor.fontLigatures"]: boolean;
  ["editor.quickSuggestions"]: { other: QSChoice };
  ["editor.suggestOnTriggerCharacters"]: boolean;
}

let statusBarItem: vscode.StatusBarItem;

export function activate(context: vscode.ExtensionContext) {
  let teacherMode = false;

  // Create a status bar item
  statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
  );

  statusBarItem.text = "Teacher Mode (disabled)";
  statusBarItem.command = "teacher-mode.toggle"; // The command to execute when the item is clicked
  // Show the status bar item
  statusBarItem.show();

  let disposable = vscode.commands.registerCommand(
    "teacher-mode.toggle",
    () => {
      if (teacherMode === false) {
        teacherMode = true;
        statusBarItem.text = "Teacher Mode (enabled)";

        // Store old settings
        const userConfig = vscode.workspace.getConfiguration();
        const originalSettings: TeacherSettings = {
          ["editor.fontLigatures"]:
            userConfig.get("editor.fontLigatures") || false,
          ["editor.quickSuggestions"]: userConfig.get(
            "editor.quickSuggestions"
          ) || { other: "on" },
          ["editor.suggestOnTriggerCharacters"]:
            userConfig.get("editor.suggestOnTriggerCharacters") || true,
        };
        context.globalState.update("originalSettings", originalSettings);

        // Update settings to teachermode
        userConfig.update("editor.fontLigatures", false, true);
        userConfig.update("editor.quickSuggestions", { other: "off" }, true);
        userConfig.update("editor.suggestOnTriggerCharacters", false, true);
      } else {
        teacherMode = false;
        statusBarItem.text = "Teacher Mode (disabled)";

        // Retrieve old settings
        const userConfig = vscode.workspace.getConfiguration();

        const originalSettings: TeacherSettings | undefined =
          context.globalState.get("originalSettings");

        if (originalSettings) {
          userConfig.update(
            "editor.fontLigatures",
            originalSettings["editor.fontLigatures"],
            true
          );
          userConfig.update(
            "editor.quickSuggestions",
            originalSettings["editor.quickSuggestions"],
            true
          );
          userConfig.update(
            "editor.suggestOnTriggerCharacters",
            originalSettings["editor.suggestOnTriggerCharacters"],
            true
          );
        } else {
          vscode.window.showWarningMessage(
            "Teacher Mode was unable to restore your settings."
          );
        }
      }
    }
  );

  context.subscriptions.push(disposable);
  context.subscriptions.push(statusBarItem);
}

export function deactivate() {}
