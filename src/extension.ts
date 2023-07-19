import * as vscode from "vscode";

// - Color buttons and make smaller
// =>

type QSChoice = "off" | "on" | "inline";
interface QSSetting {
  other: QSChoice;
}
interface TeacherSetting<T> {
  section: string;
  defaultVal: T;
  enabledVal: T;
}

function teacherSetting<T>(section: string, enabledVal: T): TeacherSetting<T> {
  const defaultVal = vscode.workspace.getConfiguration().inspect(section)
    ?.defaultValue as T;
  return {
    section,
    enabledVal,
    defaultVal,
  } as const;
}

const teacherMode = [
  teacherSetting<boolean>("editor.fontLigatures", false),
  teacherSetting<QSSetting>("editor.quickSuggestions", { other: "off" }),
  teacherSetting<boolean>("editor.suggestOnTriggerCharacters", false),
  teacherSetting<boolean>("editor.parameterHints.enabled", false),
] as const;

let statusBarItem: vscode.StatusBarItem;

async function enable(context: vscode.ExtensionContext) {
  // Store old settings
  const userConfig = vscode.workspace.getConfiguration();
  for (let settingi = 0; settingi < teacherMode.length; settingi++) {
    const section = teacherMode[settingi].section;
    // console.log("Storing:", section, userConfig.get(section));
    // Store in memory
    await context.workspaceState.update(section, userConfig.get(section));
    // Update with settings
    // console.log("Updating:", section, teacherMode[settingi].enabledVal);
    await userConfig.update(section, teacherMode[settingi].enabledVal, true);
    const newSetting = await userConfig.get(section);
    // console.log("After update:", newSetting);
  }
}
async function disable(context: vscode.ExtensionContext) {
  // Retrieve old settings
  const userConfig = vscode.workspace.getConfiguration();
  for (let settingi = 0; settingi < teacherMode.length; settingi++) {
    const section = teacherMode[settingi].section;
    await userConfig.update(section, context.workspaceState.get(section), true);
  }
}

export async function activate(context: vscode.ExtensionContext) {
  function setStatusBar(teacherMode: boolean) {
    statusBarItem.text = `${teacherMode ? "$(check)" : ""}$(mortar-board)`;
    statusBarItem.tooltip = teacherMode
      ? "Teacher mode enabled"
      : "Teacher mode disabled";
    statusBarItem.color = teacherMode
      ? new vscode.ThemeColor("terminal.ansiGreen")
      : new vscode.ThemeColor("statusBar.foreground");

    statusBarItem.show();
  }

  let teacherMode =
    ((await context.globalState.get("teacherMode")) as boolean) || false;
  // Create a status bar item
  statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
  );
  statusBarItem.command = "teacher-mode.toggle"; // The command to execute when the item is clicked
  // Set the status bar item
  setStatusBar(teacherMode);
  // Show the status bar item
  statusBarItem.show();

  let disposable = vscode.commands.registerCommand(
    "teacher-mode.toggle",
    async () => {
      let teacherMode =
        ((await context.globalState.get("teacherMode")) as boolean) || false;

      if (!teacherMode) {
        await context.globalState.update("teacherMode", true);
        setStatusBar(true);
        enable(context);
      } else {
        await context.globalState.update("teacherMode", false);
        setStatusBar(false);
        disable(context);
      }
    }
  );

  context.subscriptions.push(disposable);
  context.subscriptions.push(statusBarItem);
}
