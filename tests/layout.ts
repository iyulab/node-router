import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import type { RouteContext, RouteBeginEvent, RouteDoneEvent, RouteErrorEvent, RouteProgressEvent } from '../src';
import { repeat } from 'lit/directives/repeat.js';

@customElement('preview-layout')
export class PreviewLayout extends LitElement {
  @state() context?: RouteContext;

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener('route-begin', this.handleRouteBegin);
    window.addEventListener('route-done', this.handleRouteDone);
    window.addEventListener('route-error', this.handleRouteError);
    window.addEventListener('route-progress', this.handleRouteProgress);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('route-begin', this.handleRouteBegin);
    window.removeEventListener('route-done', this.handleRouteDone);
    window.removeEventListener('route-error', this.handleRouteError);
    window.removeEventListener('route-progress', this.handleRouteProgress);
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
            <a href=${link.href} ?active=${isActive}>
              ${link.label}
            </a>
          `;
        })}
      </nav>
      
      <div class="outlet-container">
        <u-outlet></u-outlet>
      </div>
    `;
  }

  private handleRouteBegin = (e: Event) => {
    const event = e as RouteBeginEvent;
    console.info(`Route begin: `, event.context);
  };

  private handleRouteDone = (e: Event) => {
    const event = e as RouteDoneEvent;
    this.context = event.context;
    console.info(`Route done: `, event.context);
  };

  private handleRouteError = (e: Event) => {
    const event = e as RouteErrorEvent;
    const message = event.error?.message || 'Unknown error';
    console.error(`Route error: ${message}`, event.error);
  };

  private handleRouteProgress = (e: Event) => {
    const event = e as RouteProgressEvent;
    console.info(`Route Progress: ${event.progress}%`);
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

    nav a {
      color: #333;
      text-decoration: none;
      padding: 0.5rem 1rem;
      border-radius: 4px;
      transition: background 0.2s;
    }
    nav a:hover {
      background: #f0f0f0;
    }
    nav a[active] {
      color: white;
      background: #007bff;
    }

    .outlet-container {
      flex: 1;
      padding: 1.5rem;
      overflow: auto;
    }
  `;
}
