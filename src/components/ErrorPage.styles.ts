import { css } from 'lit';

export const styles = css`
  :host {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100vw;
    height: 100vh;
    padding: 2rem;
    text-align: center;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: var(--route-error-color, #333);
    background: var(--route-error-background, #fff);
    border-radius: var(--route-error-border-radius, 8px);
    box-shadow: var(--route-error-box-shadow, 0 2px 8px rgba(0, 0, 0, 0.1));
  }

  .container {
    max-width: 600px;
    margin: 0 auto;
  }

  .icon {
    font-size: 4rem;
    margin-bottom: 1rem;
    color: var(--route-error-icon-color, #f44336);
  }

  .code {
    font-size: 2.5rem;
    font-weight: bold;
    margin-bottom: 0.5rem;
    color: var(--route-error-code-color, #f44336);
  }

  .message {
    font-size: 1.25rem;
    margin-bottom: 1rem;
    color: var(--route-error-message-color, #666);
  }

  .detail {
    font-size: 0.875rem;
    margin-bottom: 2rem;
    color: var(--route-error-detail-color, #999);
    padding: 1rem;
    background: var(--route-error-detail-background, #f5f5f5);
    border-radius: 4px;
    font-family: monospace;
    text-align: left;
    overflow-x: auto;
  }

  .path {
    font-size: 0.875rem;
    margin-bottom: 1rem;
    color: var(--route-error-path-color, #999);
    font-family: monospace;
  }

  .actions {
    display: flex;
    gap: 1rem;
    justify-content: center;
    flex-wrap: wrap;
  }

  .button {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 4px;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.2s ease;
    text-decoration: none;
    display: inline-block;
    font-family: inherit;
  }

  .button--primary {
    background: var(--route-error-primary-button-bg, #2196f3);
    color: var(--route-error-primary-button-color, white);
  }

  .button--primary:hover {
    background: var(--route-error-primary-button-hover-bg, #1976d2);
    transform: translateY(-1px);
  }

  .button--secondary {
    background: var(--route-error-secondary-button-bg, #e0e0e0);
    color: var(--route-error-secondary-button-color, #333);
  }

  .button--secondary:hover {
    background: var(--route-error-secondary-button-hover-bg, #d0d0d0);
    transform: translateY(-1px);
  }

  .timestamp {
    font-size: 0.75rem;
    color: var(--route-error-timestamp-color, #ccc);
    margin-top: 2rem;
  }

  .metadata {
    margin-top: 1rem;
    padding: 1rem;
    background: var(--route-error-metadata-background, #f9f9f9);
    border-radius: 4px;
    text-align: left;
  }

  .metadata summary {
    cursor: pointer;
    font-weight: bold;
    color: var(--route-error-metadata-title-color, #666);
  }

  .metadata pre {
    margin: 0.5rem 0 0 0;
    font-size: 0.75rem;
    color: var(--route-error-metadata-content-color, #999);
    overflow-x: auto;
  }

  @media (max-width: 768px) {
    :host {
      padding: 1rem;
    }

    .icon {
      font-size: 3rem;
    }

    .code {
      font-size: 2rem;
    }

    .message {
      font-size: 1rem;
    }

    .actions {
      flex-direction: column;
      align-items: center;
    }

    .button {
      width: 100%;
      max-width: 200px;
    }
  }

  @media (prefers-color-scheme: dark) {
    :host {
      color: var(--route-error-dark-color, #e0e0e0);
      background: var(--route-error-dark-background, #1e1e1e);
    }

    .message {
      color: var(--route-error-dark-message-color, #b0b0b0);
    }

    .detail {
      background: var(--route-error-dark-detail-background, #2a2a2a);
      color: var(--route-error-dark-detail-color, #d0d0d0);
    }

    .path {
      color: var(--route-error-dark-path-color, #b0b0b0);
    }

    .button--secondary {
      background: var(--route-error-dark-secondary-button-bg, #404040);
      color: var(--route-error-dark-secondary-button-color, #e0e0e0);
    }

    .button--secondary:hover {
      background: var(--route-error-dark-secondary-button-hover-bg, #505050);
    }

    .timestamp {
      color: var(--route-error-dark-timestamp-color, #666);
    }

    .metadata {
      background: var(--route-error-dark-metadata-background, #2a2a2a);
    }

    .metadata summary {
      color: var(--route-error-dark-metadata-title-color, #b0b0b0);
    }

    .metadata pre {
      color: var(--route-error-dark-metadata-content-color, #888);
    }
  }
`;