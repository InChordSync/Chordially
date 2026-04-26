import React from 'react';

/**
 * Common test IDs used across mobile screens.
 * Reference these in components via testID={TEST_IDS.SCREEN_ROOT}
 * and in tests via getByTestId(TEST_IDS.SCREEN_ROOT).
 */
export const TEST_IDS = {
  SCREEN_ROOT: 'screen-root',
  HEADER: 'screen-header',
  BACK_BUTTON: 'back-button',
  SUBMIT_BUTTON: 'submit-button',
  LOADING_INDICATOR: 'loading-indicator',
  ERROR_MESSAGE: 'error-message',
  LIST_CONTAINER: 'list-container',
  LIST_ITEM: 'list-item',
  MODAL_OVERLAY: 'modal-overlay',
  MODAL_CLOSE: 'modal-close',
} as const;

/**
 * Mock navigation object aligned with React Navigation's NavigationProp interface.
 * Pass this into components that require a navigation prop during testing.
 *
 * @example
 * renderScreen(<MyScreen navigation={mockNavigation} />)
 */
export const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  push: jest.fn(),
  replace: jest.fn(),
  reset: jest.fn(),
  setOptions: jest.fn(),
  addListener: jest.fn(() => ({ remove: jest.fn() })),
  removeListener: jest.fn(),
  isFocused: jest.fn(() => true),
  canGoBack: jest.fn(() => true),
};

export interface RenderScreenOptions {
  /** Additional props to spread onto the component */
  props?: Record<string, unknown>;
  /** Navigation prop override; defaults to mockNavigation */
  navigation?: typeof mockNavigation;
}

/**
 * Renders a React Native screen component using React Native Testing Library (RNTL).
 * Wraps the component in any global providers (navigation container, theme, etc.)
 * needed for the screen to mount without errors.
 *
 * @param Component - The screen component to render
 * @param options   - Optional render configuration
 */
export async function renderScreen(
  Component: React.ComponentType<Record<string, unknown>>,
  options: RenderScreenOptions = {},
): Promise<ReturnType<typeof import('@testing-library/react-native').render>> {
  const { render } = await import('@testing-library/react-native');

  const nav = options.navigation ?? mockNavigation;
  const extraProps = options.props ?? {};

  return render(
    React.createElement(Component, { navigation: nav, ...extraProps }),
  );
}
