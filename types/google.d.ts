// Google Identity Services TypeScript declarations
interface GoogleAccounts {
  id: {
    initialize: (config: {
      client_id: string;
      callback: (response: { credential: string }) => void;
    }) => void;
    prompt: () => void;
    renderButton: (element: HTMLElement, config: any) => void;
  };
}

interface Window {
  google?: GoogleAccounts;
}

