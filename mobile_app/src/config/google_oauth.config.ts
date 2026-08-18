/**
 * CallShield Google OAuth Configuration
 *
 * To register your own Google OAuth Client ID for production:
 * 1. Go to Google Cloud Console: https://console.cloud.google.com/
 * 2. Create a project named "CallShield"
 * 3. Navigate to APIs & Services -> Credentials -> Create Credentials -> OAuth client ID
 * 4. Choose "Web application" or "Android" and copy your Client ID below.
 */

export const GOOGLE_OAUTH_CONFIG = {
  // Web Application Client ID (Used for backend token verification)
  WEB_CLIENT_ID: 'YOUR_GOOGLE_WEB_CLIENT_ID.apps.googleusercontent.com',

  // Android Client ID (Used for native Android Google Sign-In)
  ANDROID_CLIENT_ID: 'YOUR_GOOGLE_ANDROID_CLIENT_ID.apps.googleusercontent.com',

  // iOS Client ID (Used for native iOS Google Sign-In)
  IOS_CLIENT_ID: 'YOUR_GOOGLE_IOS_CLIENT_ID.apps.googleusercontent.com',
};
