interface Window {
  fbAsyncInit?: () => void;
  google?: {
    accounts: {
      id: {
        initialize: (config: {
          client_id: string;
          callback: (response: { credential: string }) => void;
          auto_select?: boolean;
          cancel_on_tap_outside?: boolean;
        }) => void;
        renderButton: (
          parent: HTMLElement,
          options: {
            theme?: "outline" | "filled_blue" | "filled_black";
            size?: "small" | "medium" | "large";
            text?: "signin_with" | "signup_with" | "continue_with" | "signin";
            shape?: "rectangular" | "pill" | "circle" | "square";
            logo_alignment?: "left" | "center";
            width?: number;
            locale?: string;
          }
        ) => void;
        prompt: (
          momentListener?: (moment: { type: string; data?: unknown }) => void
        ) => void;
        cancel: () => void;
        disableAutoSelect: () => void;
        storeCredential: (
          credential: { id: string; password: string },
          callback: () => void
        ) => void;
        revoke: (hint: string, callback: (response: { error?: string }) => void) => void;
        onGoogleLibraryLoad: () => void;
      };
    };
  };
  FB?: {
    init: (config: {
      appId: string;
      cookie?: boolean;
      xfbml?: boolean;
      version: string;
    }) => void;
    login: (
      callback: (response: {
        status?: string;
        authResponse?: {
          accessToken: string;
          expiresIn: number;
          signedRequest: string;
          userID: string;
        };
      }) => void,
      options?: { scope: string }
    ) => void;
    api: (
      path: string,
      params: { fields: string },
      callback: (response: Record<string, unknown>) => void
    ) => void;
    getLoginStatus: (
      callback: (response: {
        status: string;
        authResponse?: {
          accessToken: string;
          expiresIn: number;
          signedRequest: string;
          userID: string;
        };
      }) => void
    ) => void;
  };
}