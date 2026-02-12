# Google Sign-In Setup Guide (Android)

If you are seeing the error `serverClientId must be provided on Android`, it means the `google_sign_in` plugin (version 7.0.0+) requires a Web Client ID to identify the "server" part of the OAuth flow, even for identity-only logins.

## Option 1: Manual Client ID (Recommended for Rapid Setup)

1.  Go to the [Google Cloud Console Credentials Page](https://console.cloud.google.com/apis/credentials).
2.  Select your project.
3.  Click **Create Credentials** > **OAuth 2.0 Client ID**.
4.  Select **Web application** as the Application Type.
5.  Name it (e.g., "Expenze Web Client").
6.  You do NOT need to add "Authorized redirect URIs" for mobile-only use.
7.  Click **Create** and copy the **Client ID** (e.g., `123456789-abc123.apps.googleusercontent.com`).
8.  Open `lib/presentation/providers/auth_provider.dart`.
9.  Locate the `initialize()` method.
10. Pass the copied ID to the `initialize` call:

```dart
await _googleSignIn.initialize(
  serverClientId: "YOUR_COPIED_CLIENT_ID",
);
```

## Option 2: Firebase Integration (Recommended for Production)

1.  Go to the [Firebase Console](https://console.firebase.google.com/).
2.  Enable **Google Sign-In** in the Authentication settings.
3.  Add an **Android App** to your project with your package name (`com.expenze.mobile`).
4.  Provide your **SHA-1 fingerprint** (run `./gradlew signingReport` in the `android` folder to find it).
5.  Download the `google-services.json` file.
6.  Place it in `android/app/`.
7.  Add the Google Services plugin to your `android/build.gradle` and `android/app/build.gradle`.

---

**Note:** The application will remain functional without Google Sign-In using the "Direct Setup" (Local Login) method.

Date: 2026-02-12
