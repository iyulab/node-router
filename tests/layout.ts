import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import type { RouteContext, RouteBeginEvent, RouteDoneEvent, RouteErrorEvent, RouteProgressEvent } from '../src';

@customElement('preview-layout')
export class PreviewLayout extends LitElement {
  @state() context?: RouteContext;
  @state() progress: number = 0;

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener('route-begin', this.handleRouteBegin);
    window.addEventListener('route-done', this.handleRouteDone);
    window.addEventListener('route-progress', this.handleRouteProgress);
    window.addEventListener('route-error', this.handleRouteError);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('route-begin', this.handleRouteBegin);
    window.removeEventListener('route-done', this.handleRouteDone);
    window.removeEventListener('route-progress', this.handleRouteProgress);
    window.removeEventListener('route-error', this.handleRouteError);
  }

  render() {
    const links = [
      { href: '/', label: 'Home' },
      { href: '/context', label: 'Context' },
      { href: '/nested', label: 'Nested (Lit)' },
      { href: '/nested/react', label: 'Nested (React)' },
      { href: '/error', label: 'Error' },
    ];

    return html`
      <nav>
        ${repeat(links, link => link.href, link => {
          const isActive = link.href === this.context?.pathname || 
            (link.href !== '/' && this.context?.pathname?.startsWith(link.href));
          
          return html`
            <u-link class="link" href=${link.href} ?active=${isActive}>
              ${link.label}
            </u-link>
          `;
          // return html`
          //   <a class="link" href=${link.href} ?active=${isActive}>
          //     ${link.label}
          //   </a>
          // `;
        })}

        <div style="flex:1"></div>

        <span class="progress">
          Progress: ${this.progress}%
        </span>
      </nav>
      
      <div class="viewport">
        <u-outlet></u-outlet>
      </div>
    `;
  }

  private handleRouteBegin = (e: Event) => {
    const event = e as RouteBeginEvent;
    this.progress = 0;
    console.info(`Route begin: `, event.context);
  };

  private handleRouteDone = (e: Event) => {
    const event = e as RouteDoneEvent;
    this.context = event.context;
    this.progress = 100;
    console.info(`Route done: `, event.context);
  };

  private handleRouteProgress = (e: Event) => {
    const event = e as RouteProgressEvent;
    this.progress = event.progress;
    console.info(`Route Progress: ${event.progress}%`);
  };

  private handleRouteError = (e: Event) => {
    const event = e as RouteErrorEvent;
    const message = event.error?.message || 'Unknown error';
    console.error(`Route error: ${message}`, event.error);
  };

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      width: 100vw;
      height: 100vh;
      background: #f5f5f5;
    }

    nav {
      background: white;
      padding: 1rem 2rem;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: 1rem;
    }

    nav .link {
      color: #333;
      text-decoration: none;
      padding: 0.5rem 1rem;
      border-radius: 4px;
      transition: background 0.2s;
    }
    nav .link:hover {
      background: #f0f0f0;
    }
    nav .link[active] {
      color: white;
      background: #007bff;
    }

    nav .progress {
      font-size: 0.9rem;
      color: #666;
    }

    .viewport {
      flex: 1;
      padding: 1.5rem;
      overflow: auto;
    }
  `;
}
