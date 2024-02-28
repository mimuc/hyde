import { GrMLBlock } from '../../core/graphical/blocks';
import { GrMLCodeSnippet } from '../../core/textual/code-snippet';
import { GrMLEditor } from '../../core/editor';
import { GrMLElement } from '../../core/element';
import { GrMLFunction, GrMLModelFunction } from '../../core/function';
import { GrMLModel } from '../../core/model';
import { GrMLLineEnumeration } from './line-enumeration';
import { GrMLRepresentation, REPRESENTATION_TYPES } from '../../core/representation';
import { GrMLFunctionSelectEvent } from '../../core/event';
import { GrMLCustomFunction } from '../models/functions/custom';
import { GrMLToolbar } from '../../core/textual/toolbar';
import { GrMLTensorflowSequentialModel } from '../../models/tf';
import { GrMLCompositeNNFunction } from '../../models/composite/functions/compositeNN';

/**
 * Abstract class for representing arbitrary textual editors.
 * Provides a enumeration for each code line (not yet).
 */
export abstract class GrMLTextEditor<M extends GrMLModel> extends GrMLElement implements GrMLEditor<M> {
  public REPRESENTATION_TYPE = REPRESENTATION_TYPES.CODE;

  public enumeration = <GrMLLineEnumeration>document.createElement(GrMLLineEnumeration.TAG_NAME);
  public toolbar = <GrMLToolbar>document.createElement(GrMLToolbar.TAG_NAME);

  protected container: HTMLElement = (() => {
    const container = document.createElement('div');
    container.classList.add('flex-container');
    return container;
  })(); // flex-container for workspace

  protected scrollContainer = (() => {
    const scrollContainer = document.createElement('div');
    scrollContainer.id = 'scroll';
    return scrollContainer;
  })();  // container for scrollable content

  protected scriptingArea = (() => {
    const scriptingArea = document.createElement('div');
    scriptingArea.id = 'scripting-area';
    return scriptingArea;
  })();  // container for editable content

  public abstract model: M;


  constructor (
    additionalStyles: Node[] = [],
  ) {
    super([
      ...additionalStyles,
    ]);

    // register event listeners
    this.addEventListener('click', (e) => {
      // vsc dispatches a pointer event with a path
      // for e: currentTarget = target, and therefore the path is used to check the real target

      // if the background is clicked, de-select all functions
      if ((<any> e).path[ 0 ] === this.container || (<any> e).path[ 0 ] === this.scrollContainer) {
        window.dispatchEvent(new GrMLFunctionSelectEvent(null));

        // add a new blank function and select as target
        // const newFunction = this.model.addFunction(GrMLCustomFunction.VERBOSE_NAME);
      }
    });
  }

  public onSelect (f: GrMLFunction | null): void {
    // do nothing?
  }

  public onGroup (fs: GrMLBlock[]): void {
    throw new Error('Method not implemented.');
  }

  public onDuplicate (fs: GrMLBlock[]): void {
    throw new Error('Method not implemented.');
  }

  onDrop (e: DragEvent): void {
    throw new Error('Method not implemented.');
  }

  /**
   * Updates the postion of a CodeSnippet based on its connections.
   *
   * @param f function
   * @returns
   */
  public updateConnections (f: GrMLFunction): void {
    if (!this.model) {
      return;
    }

    // TODO: does this work for closure?
    const connectionUUIDs: string[] = [];
    if (f.returnValues.length > 0) {
      f.returnValues.forEach((reval) => {
        reval.connections.forEach((c) => { if (c.end) { connectionUUIDs.push(c.end.parent.uuid); } });
      });
    }
    if (connectionUUIDs.length > 0) {
      const nodes = [ ...this.scriptingArea.childNodes ];
      const nodeOfF = nodes.find((n) => (<GrMLCodeSnippet> n).parent.uuid === f.uuid);
      if (nodeOfF) {
        let i = nodes.length - 1;
        // Traverse nodes beginning with the last element
        while (i > -1) {
          const nodeUUID = (<GrMLCodeSnippet> nodes[ i ]).parent.uuid;
          connectionUUIDs.forEach((c) => {
            if (c === nodeUUID) {
              // insert after
              this.scriptingArea.insertBefore(nodeOfF, nodes[ i ]);
              i = -1; // end while
            }
          });
          i--;
        }
      }
    }
  }

  public update () {
    if (!this.model) {
      console.info('No model - nothing to draw');
      return;
    }

    // Hide code snippets that have been removed from the model
    [ ...this.scriptingArea.childNodes ].forEach((n) => {
      const codeSnippet = <GrMLCodeSnippet> n;
      // get each node which has no GrMlFunction as parent = was deleted from model
      if (this.model.children.indexOf(codeSnippet.parent) < 0) {
        // Remove line enumeration
        for (let i = 0; i < codeSnippet.loc; i++) { this.enumeration.removeLine(); }
        this.scriptingArea.removeChild(codeSnippet);
      } else {
        // codesnippet is within a closure
        const closures = (codeSnippet.shadowRoot?.querySelectorAll('.closure'));
        closures?.forEach((closure) => {
          closure.shadowRoot?.childNodes.forEach((codeline) => {
            // TODO: arrange in right order

            const closureCodeSnippet = <GrMLCodeSnippet> codeline;
            // if no functions exists with the same uuid as the code-line, remove it
            if (!this.model.doesFunctionExist(closureCodeSnippet.parent.uuid)){
              closure.shadowRoot?.removeChild(closureCodeSnippet);
            }
          });
        });
      }
    });


    // TODO: re-write variables for connections removed from the model

    // Display all new functions and their connections as code
    this.model.children.forEach((grMLfunction: GrMLFunction) => {
      const codeSnippet = grMLfunction.representations[ <REPRESENTATION_TYPES> this.REPRESENTATION_TYPE ] as GrMLCodeSnippet;

      // display the function
      if (codeSnippet && codeSnippet.parentNode !== this.scriptingArea) {
        // append to scripting area
        this.scriptingArea.appendChild(codeSnippet);
        // Add line enumeration
        for (let i = 0; i < codeSnippet.loc; i++) { this.enumeration.appendLine(); }
      }

      // FIXME
      // append children to closure
      if (grMLfunction instanceof GrMLCompositeNNFunction) {
        grMLfunction.model.update();

        // remove code snippets whose functions still exist but are not (in-)directly connected to the InputFunction
        // this does not work with 'forEach' and 'Node.removeChild'
        if (codeSnippet.closure) {
          for (let i = 0; i < codeSnippet.closure?.childNodes.length; i++) {
            const closureCodeSnippet = <GrMLCodeSnippet> codeSnippet.closure.childNodes[i];
            if (!(<GrMLTensorflowSequentialModel> grMLfunction.model).layers.includes(closureCodeSnippet.parent)){
              codeSnippet.closure?.removeChild(closureCodeSnippet);
              i--;
            }
          }
        }

        (<GrMLTensorflowSequentialModel> grMLfunction.model).layers.forEach((f) => {
          const parentClosure = codeSnippet.closure;
          const closureSnippet = f.representations[ <REPRESENTATION_TYPES> this.REPRESENTATION_TYPE ] as GrMLCodeSnippet;

          // append codeSnippet to parent closure if not already appended
          if (closureSnippet && parentClosure && closureSnippet.parentNode !== parentClosure) {
            // closureSnippet.code = '  ' + closureSnippet.code; // indent
            parentClosure.append(closureSnippet);
          }
        });
      } else if (grMLfunction instanceof GrMLModelFunction) {
        grMLfunction.model.children.forEach((f) => {
          const parentClosure = codeSnippet.closure;
          const closureSnippet = f.representations[ <REPRESENTATION_TYPES> this.REPRESENTATION_TYPE ] as GrMLCodeSnippet;

          // append codeSnippet to parent closure if not already appended
          if (closureSnippet && parentClosure && closureSnippet.parentNode !== parentClosure) {
            // closureSnippet.code = '  ' + closureSnippet.code; // indent
            parentClosure.append(closureSnippet);
          }
        });
      }
      grMLfunction.update();
    });

    // highlighting selected
    const highlight = (model: GrMLModel) => {
      model.children.map((f) => {
        const rep = <GrMLRepresentation>f.representations[this.REPRESENTATION_TYPE];
        if (rep) {
          if (f.selected) {
            rep.classList.add('selected');
          } else {
            rep.classList.remove('selected');
          }
        }
        if (f instanceof GrMLModelFunction) {
          // highlight function from sub-models
          highlight(f.model);
        }
      }
      );
    };
    highlight(this.model);
  }
}