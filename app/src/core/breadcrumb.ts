import { GrMLSubModelSelectedEvent } from './event';
import { GrMLModel } from './model';
import { consoleLabelStyle } from './util';

/**
 * Breadcrumb navigation to move between models and their submodels
 */
export class GrMLModelBreadcrumb extends HTMLElement {
  public static TAG_NAME = 'grml-breadcrumb';

  public currentPath: GrMLModel[] = [ ];

  /**
   * @returns {string[]} Shallow copy of the current path
   */
  public get path (): GrMLModel[] {
    return this.currentPath.slice();
  }

  public set path (p: GrMLModel[]) {
    this.currentPath = p;
    this.innerHTML = '';

    this.currentPath.forEach((p, i) => {
      const link = document.createElement('a');
      link.innerText = p.name;
      this.appendChild(link);
      const fullPath = this.currentPath.slice(0, i + 1);
      link.addEventListener('click', (e) => {
        e.preventDefault();
        console.info(`%cNavigate editor to model ${fullPath.map((p) => p.name).join('/')}`, consoleLabelStyle('#FF4343'));
        window.dispatchEvent(new GrMLSubModelSelectedEvent(this.currentPath.slice(0, i + 1)));
      });
    });
  }
}