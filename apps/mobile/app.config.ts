import { ExpoConfig, ConfigContext } from 'expo/config'

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name:    'EstoqueApp',
  slug:    'estoque-app',
  version: '1.0.0',
  orientation: 'portrait',
  icon:    './assets/icon.png',
  scheme:  'estoque',
  userInterfaceStyle: 'automatic',
  splash: {
    image:      './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#FAFAF8',
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.inventorysaas.mobile',
    infoPlist: {
      NSCameraUsageDescription:
        'O EstoqueApp usa a câmera para escanear QR codes dos produtos e agilizar o controle de estoque.',
      NSMicrophoneUsageDescription:
        'Acesso ao microfone requerido pelo framework de câmera.',
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#FAFAF8',
    },
    package:             'com.inventorysaas.mobile',
    googleServicesFile:  './google-services.json',
    permissions: [
      'android.permission.CAMERA',
      'android.permission.VIBRATE',
    ],
  },
  web: {
    bundler: 'metro',
    output:  'static',
    favicon: './assets/favicon.png',
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    [
      'react-native-vision-camera',
      {
        cameraPermissionText:
          'O EstoqueApp usa a câmera para escanear QR codes dos produtos.',
        enableMicrophonePermission: false,
        enableCodeScanner: true,
      },
    ],
    [
      'expo-notifications',
      {
        icon:  './assets/notification-icon.png',
        color: '#A8C8E8',
        sounds: [],
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    eas: {
      projectId: 'seu-eas-project-id',
    },
  },
})
