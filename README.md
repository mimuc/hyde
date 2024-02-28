# HyDE - A HYbrid Development Envinment for Creating Data-Driven Applications

This is the repository for the HyDE development environment for creating
software for Machine Learning and similiar tasks via a multi-paradigm editor,
currently combining graphical and textual programming side-by-side.

## Running HyDE

HyDE is implemented as a Visual Studio Code webview with a nodejs websocket server.
In order to run it, you must...

1. Open this directory in Visual Studio Code
2. Install all dependencies: `Python 3` and `for Windows: Visual Studio - Desktop dev with C++`, then run `npm install`
3. Compile the core app:
```
npm run app-compile
```
4. Start a VSC instance hosting the webview.
  The default build task for this project will do this for you.
  Press F5 to run this task.
5. Open any *.grml.json file to start using HyDE.


## Textual extension
To use the textual extension of HyDE, follow the steps above and ...

1. Split the editor, such that the same file is opened twice.
2. Right-click the filename in one editor and 'Reopen Editor With ...'

## Developing the extension

HyDE's interface to access, write and save to files is implemented within the [ext > src](/ext/src/) folder.
To compile the extension:

```
npm run vsc-compile
```
