
Firebase Admin Service Account
------------------------------

Place the `firebase-admin.json` service account key in this directory so server-side code can load it for Firebase Admin SDK usage. The key is required for sending FCM push notifications and for other privileged Firebase operations from backend services.

The Firebase SDK helpers are located in [podverse-external-services](https://github.com/podverse/podverse-external-services).

Usage notes:

- **Location**: Keep the key at `config/firebase/firebase-admin.json` (this path is gitignored).
- **Purpose**: Used by the Firebase Admin SDK to authenticate server requests (for example, sending FCM messages to clients).
- **Security**: Do not commit this file to version control. The project's `.gitignore` already excludes `config/firebase/firebase-admin.json`.
- **Reference**: See this guide for FCM with Next.js and Firebase Cloud Messaging: https://dev.to/na1969na/implementing-push-notifications-with-nextjs-and-firebase-cloud-messaging-4n6o
