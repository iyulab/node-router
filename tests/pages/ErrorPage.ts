import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { RouteError } from '../../src';

@customElement('error-page')
export class ErrorPage extends LitElement {
  
  @property({ type: Object }) 
  error: RouteError | null = null;

  render() {
    if (!this.error) {
      return html`<div>No error information available.</div>`;
    }
    
    return html`
      <div class="error-container">
        <h1>😢</h1>
        <div class="error-code">${this.error.code || 'ERROR'}</div>
        <div class="error-message">${this.error.message || 'Something went wrong'}</div>
        <a href="/">← Back to Home</a>
      </div>
    `;
  }

  static styles = css`
    :host {
      display: block;
      padding: 2rem;
    }

    .error-container {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 3rem;
      border-radius: 16px;
      color: white;
      text-align: center;
    }

    h1 {
      font-size: 4rem;
      margin: 0 0 1rem 0;
    }

    .error-code {
      font-size: 1.5rem;
      font-weight: bold;
      margin-bottom: 0.5rem;
      opacity: 0.9;
    }

    .error-message {
      font-size: 1.2rem;
      margin-bottom: 2rem;
      opacity: 0.8;
    }

    a {
      display: inline-block;
      background: white;
      color: #667eea;
      padding: 0.75rem 2rem;
      border-radius: 8px;
      text-decoration: none;
      font-weight: bold;
      transition: transform 0.2s;
    }

    a:hover {
      transform: translateY(-2px);
    }
  `;
}
