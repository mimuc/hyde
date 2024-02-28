import { GrMLElement } from '../element';
import { GrMLFunction } from '../function';
import { GrMLCodeSerialization } from '../serializable.interface';
import { stylesheet, template } from '../util';
import { Serializable } from '../serializable.interface';
import { SELECTION_TYPE, GrMLFunctionChangedEvent, GrMLFunctionSelectEvent, GrMLUpdateVariablesMessage, GrMLNameChangeEvent, NAME_CHANGE_EVENTS, GrMLPortConnectedEvent } from '../event';
import { CODE_INVALID_RESPONSE, HasErrors } from '../error-reporting';
import { GrMLRepresentation, REPRESENTATION_TYPES } from '../representation';
import { GrMLProperties } from '../properties';
import { GrMLConnection, GrMLFunctionIO, GrMLParameter, GrMLReturnValue } from '../functionIO';
import { GrMLConsole } from '../console';


export class GrMLCodeSnippet extends GrMLElement implements GrMLRepresentation, Serializable, HasErrors {
  public static TAG_NAME = 'grml-code';

  public readonly REPRESENTATION_TYPE = REPRESENTATION_TYPES.CODE;

  public errors: string[] = [];
  public closure?: ShadowRoot | undefined; // container for child-functions of the associated model
  public endTemplate?: string;
  protected codefield: HTMLElement | null | undefined; // container to append several code-snippets to
  protected container: Element | null | undefined; // container to append code into
  private readonly warnbox = (() => {
    const box = document.createElement('ul');
    box.classList.add('warnings');
    return box;
  })();

  private oldCode: string; // original code before it is altered
  private content: string[] = [];

  constructor (
    public parent: GrMLFunction,
    public title: string,
    private codeTemplate: (params: string[], rets: string[], properties: GrMLProperties) => string[] = (params, rets, properties) => []
  ) {
    super([
      stylesheet`css/grml-text-editor.css`,
      template`
        <div class="code-snippet">
        <button id="run"></button>
        <div class="code-container">
          <pre class="code"></pre>
        </div>
        </div>`
    ]);

    // Set up DOM:
    this.shadowRoot?.append(this.warnbox);
    this.container = this.shadowRoot?.querySelector('.code-container');
    if (this.container) { this.container.id = this.uuid; }
    this.codefield = this.container?.querySelector('.code');

    if (this.parent.executable) {
      const runButton = this.shadowRoot?.querySelector('#run');
      if (runButton) {
        runButton.classList.add('visible');
        runButton.innerHTML = '&#9654';
        runButton.addEventListener('click', () => this.parent.execute());
      }
    }

    this.code = this.codeTemplate(
      this.parent.parameters.map((param) => param.name),
      this.parent.returnValues.map((ret) => ret.name),
      this.parent.properties,
    ).join('\n');
    this.oldCode = this.code;

    this.codefield?.addEventListener('click', (e) => {
      // Highlight a code block when clicked
      this.oldCode = this.code; // save unedited code
      e.preventDefault();
      window.dispatchEvent(new GrMLFunctionSelectEvent(this.parent, e.ctrlKey ? SELECTION_TYPE.CTRL_TRUE : SELECTION_TYPE.SWITCH));
    });

    this.codefield?.addEventListener('blur', (e) => {
      // interpret code when edited
      // serialize code and send via server
      if (this.oldCode !== this.code) {
        this.updateVaraiablesFromCode();
        window.dispatchEvent(new GrMLFunctionChangedEvent(this.parent));
      }
    });

    if (this.codefield) {
      this.codefield.contentEditable = 'true';
      this.codefield.focus();
      // this.setCaret();
    }
  }

  public get loc (): number {
    return this.codefield?.innerText.split('\n').length ?? 0;
  }

  public get code () {
    return this.codefield?.innerText || '';
  }

  public set code (code: string) {
    if (this.codefield) {
      this.codefield.innerHTML = code;
    }
  }

  public get selected (): boolean {
    return Boolean(this.container?.classList.contains('selected'));
  }

  public set selected (h: boolean) {
    if (h) {
      this.container?.classList.add('selected');
    } else {
      this.container?.classList.remove('selected');
    }
  }

  serialize (): GrMLCodeSerialization {
    return {
      type: this.parent.name,
      content: this.content,
    };
  }

  /**
   * Resets and updates code based on the parameters and return values of function.
   */
  public reset () {
    this.code = this.codeTemplate(
      this.parent.parameters.map((param) => param.name),
      this.parent.returnValues.map((ret) => ret.name),
      this.parent.properties,
    ).join('\n');
    this.parent.warnings = this.parent.warnings.filter((w) => w !== CODE_INVALID_RESPONSE); // calling remove warning results in infinite loop
  }

  /**
   * Updates code based on the parameters and return values of function
   */
  public update () {
    this.reset();
    this.indicateAndDisplayWarnings();
  }

  public updateVaraiablesFromCode (): boolean {
    this.readUpdateParametersFromCode();
    this.readUpdateReturnValuesFromCode();
    // TODO: read properties and names from code

    const generatedCode = this.codeTemplate(
      this.parent.parameters.map((param) => param.name),
      this.parent.returnValues.map((ret) => ret.name),
      this.parent.properties,
    ).join('\n');

    const warn = CODE_INVALID_RESPONSE;
    if (this.code !== generatedCode) {
      if (!this.parent.warnings.includes(warn)) {
        this.parent.warnings.push(warn);
      }
    } else {
      this.parent.removeWarning(warn);
    }
    this.indicateAndDisplayWarnings();
    return true;
  }

  /**
   * Reads return values from code string, updates the view
   * Adds connections based on the variable names.
   *
   * @returns
   */
  protected readUpdateReturnValuesFromCode (): boolean {
    const regexReval1 = /^[^=]*/; // everything in front of the '='
    const regexInBraces = /\((.*?)\)/; // everything in braces '( ... )

    // get returnValue names
    const revalNames = this.code.match(regexReval1);
    // code in front of the first '=' defines the return values
    if (revalNames && revalNames[ 0 ]) {
      let revalVariableNames = [];
      const reValsInBraces = revalNames[ 0 ].match(regexInBraces);
      // reValsInBraces[ 0 ] is with braces (), reValsInBraces[ 1 ] is without braces
      if (reValsInBraces && reValsInBraces[ 1 ]) {
        // more than one return value
        revalVariableNames = reValsInBraces[ 1 ].split(',');
      } else {
        // add to list
        revalVariableNames.push(revalNames[ 0 ]);
      }

      revalVariableNames.forEach((revalName, index) => {
        revalName = revalName.replace(/\s/g, ''); // remove all whitespaces
        const reval = this.parent.returnValues[ index ]; // associated return value
        const revalReference = this.parent.parent?.getVariableFromName(revalName);

        if (revalReference) {
          // case return value is already used/ definded in other function

          // find the next sibling using this value
          // TODO: search recursively!
          const nextElement = <GrMLCodeSnippet> this.shadowRoot?.nextSibling;
          if (nextElement) {
            const elementToConnect = nextElement.parent.parameters.find((param) => param.name === revalName);
            if (elementToConnect) {
              // check if the data type is the same
              if ((elementToConnect.type.type === revalReference.type.type) && (elementToConnect.type.type === reval.type.type)) {
                this.addConnection(reval, elementToConnect);
              } else {
                GrMLConsole.error('Variable has wrong data type.');
                throw new Error('Variable can not be inserted here. Wrong data type.');
              }
            }
            window.dispatchEvent(new GrMLNameChangeEvent(NAME_CHANGE_EVENTS.RETURN_VALUE, reval.uuid, reval.name, reval.parent?.uuid)); // notify other editors to update
          } // else no connection needs to be added

        } else {
          // if the variable is defined the first time
          revalName = this.updateVarNameAndAddToModel(revalName, reval); // add variable to model and update name
          window.dispatchEvent(new GrMLUpdateVariablesMessage(reval)); // subsequently change variable names in this model
          window.dispatchEvent(new GrMLNameChangeEvent(NAME_CHANGE_EVENTS.RETURN_VALUE, reval.uuid, reval.name, reval.parent?.uuid)); // notify other editors to update
        }

      });
      return true;
    }
    return false;
  }


  /**
   * Reads the parameter in front of the '.' from code string, updates the view
   * Adds a connection based on the variable name.
   *
   * @returns
   */
  protected readUpdateParametersFromCode (): boolean {
    // do something, only if parent function allows parameters
    if (this.parent.parameters.length > 0) {

      const regexParam = /=([^.]*)/m; // everything after the first '=' and in front of the '.'

      // get returnValue names
      const paramNames = this.code.match(regexParam);
      if (paramNames && paramNames[ 1 ]) {
        let paramName = paramNames[ 1 ];
        paramName = paramName.replace(/\s/g, ''); // remove all whitespaces
        const index = 0;

        const param = this.parent.parameters[ index ]; // associated parameter
        const paramRefernce = this.parent.parent?.getVariableFromName(paramName);

        if (paramRefernce) {
          // case variable is already used/ definded in other function

          // find the last sibling defining this value
          // TODO: search recursively!
          const previousElement = <GrMLCodeSnippet> this.previousSibling;
          if (previousElement) {
            const elementToConnect = previousElement.parent.returnValues.find((reval) => reval.name === paramName);
            if (elementToConnect) {
              // check if the data type is the same
              if ((elementToConnect.type.type === paramRefernce.type.type) && (elementToConnect.type.type === param.type.type)) {
                this.addConnection(elementToConnect, param);
              } else {
                // TODO: insert, but add warning
                GrMLConsole.error('Variable has wrong data type.');
                throw new Error('Variable can not be inserted here. Wrong data type.');
              }
            }
          }
        } // else no connection needs to be added

        // add and update variable
        paramName = this.updateVarNameAndAddToModel(paramName, param); // add variable to model and update name
        window.dispatchEvent(new GrMLUpdateVariablesMessage(param)); // subsequently change variable names in this model
        window.dispatchEvent(new GrMLNameChangeEvent(NAME_CHANGE_EVENTS.PARAMETER, param.uuid, param.name, param.parent?.uuid)); // notify other editors to update
        return true;
      }
      return false;
    }
    return true;
  }

  private indicateAndDisplayWarnings (){
     // indicate warnings
     if (this.parent.warnings.length) {
      this.classList.add('has-warnings');
    } else {
      this.classList.remove('has-warnings');
    }
    // display warnings
    this.warnbox.innerHTML = '';
    this.parent.warnings.forEach((warn) => {
      const li = document.createElement('li');
      li.innerText = warn.message;
      this.warnbox.appendChild(li);
    });
  }

  /**
   * Adds the connection to the parent model and notifies other editors.
   * 
   * @param start 
   * @param end 
   */
  private addConnection (start: GrMLReturnValue, end: GrMLParameter) {
    const connectionInFunction = new GrMLConnection();

    // add connection to function
    connectionInFunction.start = start;
    connectionInFunction.end = end;
    connectionInFunction.start.connections.push(connectionInFunction);
    connectionInFunction.end?.connections.push(connectionInFunction);

    window.dispatchEvent(new GrMLPortConnectedEvent(connectionInFunction.serialize(), connectionInFunction));
  }

  /**
   *
   * @param value
   * @param functionIO
   * @returns
   */
  private updateVarNameAndAddToModel (value: string, functionIO: GrMLFunctionIO): string {
    const type = functionIO.type;
    const oldName = functionIO.name;

    // function IO is renamed
    if (oldName) {
      if (value === oldName) {
        // name did not change
        return value; // do nothing
      } else {
        // remove old variable
        this.parent.parent?.removeVariable(oldName);
      }
    }
    this.parent.parent?.addVariable(value, type); // add to model
    functionIO.name = value; // update name
    return value;
  }


  // private setCaret () {
  //   const range = document.createRange();
  //   const sel = window.getSelection();

  //   range.setStart(this.codefield, 0);
  //   range.collapse(true);

  //   sel.removeAllRanges();
  //   sel.addRange(range);
  // }
}