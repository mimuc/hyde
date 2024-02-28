import { stylesheet } from '../core/util';


export class GrMLTabWrapper extends HTMLElement {
  private tabList = document.createElement('ul');
  private tabContent = (() => {
    const wrapper = document.createElement('div');
    wrapper.classList.add('tab-wrapper');
    return wrapper;
  })();
  private tabs: GrMLTab[] = [ ];
  private activeTab: GrMLTab | null = null;

  constructor () {
    super();
    [ ...this.children ].forEach((n) => {
      this.addTab(<GrMLTab> n);
      this.removeChild(n);
    });

    this.attachShadow({ mode: 'open' });

    this.shadowRoot?.append(
      stylesheet`css/grml-tab.css`,
      this.tabList,
      this.tabContent,
    );

    if (!this.activeTab) {
      this.activateTab(0);
    }
  }

  public addTab (tab: GrMLTab) {
    const li = document.createElement('li');
    li.appendChild(document.createTextNode(tab.title));
    this.tabList.appendChild(li);

    const i = this.tabs.length;
    li.addEventListener('click', () => this.activateTab(i));
    this.tabs.push(tab);

  }

  private activateTab (i: number) {
    if (this.tabs[i]) {
      this.activeTab = this.tabs[i];
      this.tabContent.appendChild(this.tabs[0]);
      [ ...this.tabList.children ]
        .forEach((n, j) => i === j ? n.classList.add('active') : n.classList.remove('active'));
    }
  }
}

export class GrMLTab extends HTMLElement {
  constructor (public title = '') {
    super();
  }
}
