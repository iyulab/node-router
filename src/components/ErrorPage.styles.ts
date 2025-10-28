import { css } from 'lit';

export const styles = css`
  :host {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    width: 100%;
    padding: 2rem;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    background: var(--route-error-background, linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%));
    color: var(--route-error-color, #2d3748);
    line-height: 1.6;
  }

  .container {
    max-width: 520px;
    margin: 0 auto;
    text-align: center;
    background: var(--route-error-container-bg, rgba(255, 255, 255, 0.95));
    backdrop-filter: blur(10px);
    border-radius: var(--route-error-border-radius, 24px);
    padding: 3rem 2rem;
    box-shadow: var(--route-error-box-shadow, 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04));
    border: 1px solid var(--route-error-border, rgba(255, 255, 255, 0.2));
    animation: slideUp 0.6s ease-out;
  }

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .icon {
    font-size: 5rem;
    margin-bottom: 1.5rem;
    animation: bounce 0.8s ease-out 0.2s both;
    filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1));
  }

  @keyframes bounce {
    0%, 20%, 53%, 80%, 100% {
      transform: translate3d(0, 0, 0);
    }
    40%, 43% {
      transform: translate3d(0, -10px, 0);
    }
    70% {
      transform: translate3d(0, -5px, 0);
    }
    90% {
      transform: translate3d(0, -2px, 0);
    }
  }

  .code {
    font-size: 2rem;
    font-weight: 700;
    margin-bottom: 1rem;
    color: var(--route-error-code-color, #4a5568);
    letter-spacing: -0.025em;
  }

  .message {
    font-size: 1.125rem;
    margin-bottom: 2.5rem;
    color: var(--route-error-message-color, #718096);
    font-weight: 400;
    max-width: 400px;
    margin-left: auto;
    margin-right: auto;
  }

  .actions {
    display: flex;
    gap: 1rem;
    justify-content: center;
    flex-wrap: wrap;
  }

  .button {
    position: relative;
    padding: 0.875rem 2rem;
    border: none;
    border-radius: 12px;
    font-size: 0.95rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    font-family: inherit;
    min-width: 120px;
    overflow: hidden;
    user-select: none;
    -webkit-tap-highlight-color: transparent;
  }

  .button:first-child {
    background: var(--route-error-primary-button-bg, linear-gradient(135deg, #667eea 0%, #764ba2 100%));
    color: var(--route-error-primary-button-color, white);
    box-shadow: 0 4px 15px 0 rgba(102, 126, 234, 0.4);
  }

  .button:first-child:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px 0 rgba(102, 126, 234, 0.5);
  }

  .button:first-child:active {
    transform: translateY(0);
  }

  .button:last-child {
    background: var(--route-error-secondary-button-bg, rgba(255, 255, 255, 0.9));
    color: var(--route-error-secondary-button-color, #4a5568);
    border: 2px solid var(--route-error-secondary-button-border, rgba(74, 85, 104, 0.2));
    backdrop-filter: blur(10px);
  }

  .button:last-child:hover {
    background: var(--route-error-secondary-button-hover-bg, rgba(255, 255, 255, 1));
    border-color: var(--route-error-secondary-button-hover-border, rgba(74, 85, 104, 0.4));
    transform: translateY(-1px);
  }

  .button:focus-visible {
    outline: 2px solid var(--route-error-focus-color, #667eea);
    outline-offset: 2px;
  }

  .button::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: left 0.5s;
  }

  .button:hover::before {
    left: 100%;
  }

  @media (max-width: 640px) {
    :host {
      padding: 1rem;
    }

    .container {
      padding: 2rem 1.5rem;
      border-radius: 20px;
    }

    .icon {
      font-size: 4rem;
    }

    .code {
      font-size: 1.75rem;
    }

    .message {
      font-size: 1rem;
      margin-bottom: 2rem;
    }

    .actions {
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
    }

    .button {
      width: 100%;
      max-width: 280px;
      padding: 1rem 2rem;
    }
  }

  @media (max-width: 480px) {
    .container {
      margin: 1rem;
      padding: 1.5rem 1rem;
    }

    .icon {
      font-size: 3.5rem;
    }
  }

  @media (prefers-color-scheme: dark) {
    :host {
      background: var(--route-error-dark-background, linear-gradient(135deg, #1a202c 0%, #2d3748 100%));
      color: var(--route-error-dark-color, #e2e8f0);
    }

    .container {
      background: var(--route-error-dark-container-bg, rgba(45, 55, 72, 0.95));
      border: 1px solid var(--route-error-dark-border, rgba(255, 255, 255, 0.1));
    }

    .code {
      color: var(--route-error-dark-code-color, #f7fafc);
    }

    .message {
      color: var(--route-error-dark-message-color, #a0aec0);
    }

    .button:first-child {
      background: var(--route-error-dark-primary-button-bg, linear-gradient(135deg, #553c9a 0%, #764ba2 100%));
      box-shadow: 0 4px 15px 0 rgba(85, 60, 154, 0.4);
    }

    .button:first-child:hover {
      box-shadow: 0 8px 25px 0 rgba(85, 60, 154, 0.5);
    }

    .button:last-child {
      background: var(--route-error-dark-secondary-button-bg, rgba(74, 85, 104, 0.3));
      color: var(--route-error-dark-secondary-button-color, #e2e8f0);
      border: 2px solid var(--route-error-dark-secondary-button-border, rgba(226, 232, 240, 0.2));
    }

    .button:last-child:hover {
      background: var(--route-error-dark-secondary-button-hover-bg, rgba(74, 85, 104, 0.5));
      border-color: var(--route-error-dark-secondary-button-hover-border, rgba(226, 232, 240, 0.4));
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .container {
      animation: none;
    }
    
    .icon {
      animation: none;
    }
    
    .button::before {
      display: none;
    }
    
    .button {
      transition: none;
    }
  }
`;