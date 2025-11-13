import { css } from 'lit';

export const styles = css`
  :host {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    width: 100%;
    text-align: center;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    overflow: auto;
    user-select: none;
  }

  .icon {
    display: contents;
    font-size: 6rem;
    color: var(--route-error-color, #4a5568);
    opacity: 0.85;
  }

  .code {
    font-size: 2rem;
    font-weight: 700;
    margin: 1rem 0;
    color: var(--route-error-code-color, #1a202c);
    letter-spacing: -0.5px;
  }

  .message {
    font-size: 1rem;
    color: var(--route-error-message-color, #718096);
    max-width: 600px;
    line-height: 1.6;
  }

  @media (prefers-color-scheme: dark) {
    .icon {
      color: var(--route-error-dark-color, #a0aec0);
      opacity: 0.9;
    }
    .code {
      color: var(--route-error-dark-code-color, #f7fafc);
    }
    .message {
      color: var(--route-error-dark-message-color, #cbd5e0);
    }
  }
`;