/**
 * Modal Styles
 * Returns CSS styles for the Markdown modal (used in Shadow DOM)
 */

export function getModalStyles() {
  return `
    * {
      box-sizing: border-box;
    }

    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }

    .modal-overlay[hidden] {
      display: none !important;
    }

    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 999999;
      padding: 20px;
    }

    .modal-container {
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      max-width: 600px;
      width: 100%;
      max-height: calc(100vh - 40px);
      display: flex;
      flex-direction: column;
      animation: modalSlideIn 0.2s ease-out;
    }

    @keyframes modalSlideIn {
      from {
        opacity: 0;
        transform: translateY(-20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      border-bottom: 1px solid #e0e0e0;
      flex-shrink: 0;
    }

    .modal-header h2 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: #333;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 28px;
      line-height: 1;
      cursor: pointer;
      color: #666;
      padding: 0;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      transition: background-color 0.15s ease;
    }

    .close-btn:hover {
      background-color: #f0f0f0;
      color: #333;
    }

    .close-btn:focus {
      outline: 2px solid #007bff;
      outline-offset: 2px;
    }

    .modal-body {
      padding: 20px;
      flex: 1;
      overflow: auto;
    }

    .modal-body textarea {
      width: 100%;
      min-height: 200px;
      max-height: 400px;
      padding: 12px;
      border: 1px solid #ccc;
      border-radius: 4px;
      font-family: "SF Mono", Monaco, Menlo, Consolas, "Ubuntu Mono", "Liberation Mono", monospace;
      font-size: 14px;
      line-height: 1.5;
      resize: vertical;
      transition: border-color 0.15s ease, box-shadow 0.15s ease;
    }

    .modal-body textarea:focus {
      outline: none;
      border-color: #007bff;
      box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.15);
    }

    .modal-body textarea::placeholder {
      color: #999;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 16px 20px;
      border-top: 1px solid #e0e0e0;
      flex-shrink: 0;
    }

    .cancel-btn,
    .submit-btn {
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      transition: background-color 0.15s ease, border-color 0.15s ease;
    }

    .cancel-btn {
      background: #f8f9fa;
      border: 1px solid #d0d0d0;
      color: #333;
    }

    .cancel-btn:hover {
      background: #e9ecef;
      border-color: #c0c0c0;
    }

    .cancel-btn:focus {
      outline: 2px solid #007bff;
      outline-offset: 2px;
    }

    .submit-btn {
      background: #007bff;
      border: 1px solid #007bff;
      color: white;
    }

    .submit-btn:hover {
      background: #0056b3;
      border-color: #0056b3;
    }

    .submit-btn:focus {
      outline: 2px solid #007bff;
      outline-offset: 2px;
    }

    .submit-btn:active {
      background: #004494;
    }

    /* Responsive adjustments */
    @media (max-width: 480px) {
      .modal-overlay {
        padding: 10px;
      }

      .modal-container {
        max-height: calc(100vh - 20px);
      }

      .modal-header {
        padding: 12px 16px;
      }

      .modal-body {
        padding: 16px;
      }

      .modal-footer {
        padding: 12px 16px;
        flex-direction: column;
      }

      .cancel-btn,
      .submit-btn {
        width: 100%;
      }
    }
  `;
}

export default getModalStyles;
