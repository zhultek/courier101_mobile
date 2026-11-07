import { registerRootComponent } from 'expo';

import AppRoot from './src/components/AppRoot';
import { installRuntimeErrorHandling } from './src/utils/runtimeErrors';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
installRuntimeErrorHandling();
registerRootComponent(AppRoot);
