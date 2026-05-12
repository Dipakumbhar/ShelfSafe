/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';

jest.mock('@react-navigation/native', () => {
  return {
    NavigationContainer: ({ children }: { children: React.ReactNode }) => children,
  };
});

jest.mock('../src/context/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => ({ isAuthenticated: false, loading: false, user: null, logout: jest.fn() }),
}));

jest.mock('../src/context/ShopContext', () => ({
  ShopProvider: ({ children }: { children: React.ReactNode }) => children,
  useShop: () => ({
    shops: [],
    activeShop: null,
    activeShopId: null,
    loading: false,
    error: null,
    selectShop: jest.fn(),
    createShop: jest.fn(),
    updateShop: jest.fn(),
  }),
}));

jest.mock('../src/services/notificationService', () => ({
  configure: jest.fn(),
}));

jest.mock('../src/navigation/RootNavigator', () => {
  const MockRootNavigator = () => null;
  return {
    __esModule: true,
    default: MockRootNavigator,
  };
});

test('renders correctly', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<App />);
  });
});
