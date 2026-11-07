/** Loaded only when a recovery action is used; the root fallback has no app dependencies. */
export function resetViewCache(): void {
  require('../api/queryClient').queryClient.clear();
  require('../store/ui').useUi.getState().closeMenu();
}

export function returnToDashboard(): void {
  resetViewCache();
  const { navigationRef } = require('../navigation/ref');
  const { token, courier } = require('../store/auth').useAuth.getState();
  if (navigationRef.isReady()) {
    navigationRef.resetRoot({ index: 0, routes: token
      ? [{ name: 'Tabs', state: { index: 0, routes: [{ name: 'Dashboard' }] } }]
      : [{ name: courier ? 'Login' : 'CourierCode' }] });
  }
}

export async function recoverSignIn(): Promise<void> {
  await require('../store/auth').useAuth.getState().resetCourier('Please sign in again to continue.');
  resetViewCache();
}
