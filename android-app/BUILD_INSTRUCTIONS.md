# MORV Native Android Application — Compilation & APK Build Instructions

Greetings! You have transitioned MORV from a reactive web single-page app (SPA) into a **Real Native Android Application** built using **React Native with Expo Bare Workflow architecture**. 

This repository contains fully-configured, production-ready native Android files that do not rely on WebViews or wrapped website embeds. Instead, it utilizes beautiful native views, true screen transitions, safe area layout boundaries, camera access controllers, local offline database caching, and multi-thread gesture support.

---

## 📂 Project Architecture Overview

```text
/android-app
├── app.json                  # Native permissions, push credentials, and package configurations
├── package.json              # Managed React Native and native plugin dependencies
├── App.tsx                   # Main mobile application entry in Arabic RTL with Gemini AI
└── android/                  # Real native Android Project Structure (Open in Android Studio)
    ├── build.gradle          # Top-level Gradle config (Kotlin SDK version configurations)
    ├── settings.gradle       # Registry for native modules and autolinking bindings
    └── app/
        ├── build.gradle      # SDK configurations, proguard triggers, and active signing configs
        └── src/main/
            ├── AndroidManifest.xml  # CAMERA, POST_NOTIFICATIONS, and Storage permissions
            └── java/com/morv/app/
                ├── MainActivity.kt  # Android entrance activity
                └── MainApplication.kt # React native context loader
```

---

## 🛠️ Step 1: Pre-requisites & Local Machine Setup

1. **Install Node.js (v18 or higher)**.
2. **Install Android Studio**:
   - Install **SDK Platform 34** (UpsideDownCake) or later.
   - Configure a dynamic Virtual Device (Emulator) or connect a physical Android device with **USB Debugging enabled**.
3. **Download Google Services Config**:
   - Go to your Firebase Console.
   - Click "Add App" > Choose **Android**.
   - Set the Package Name to: `com.morv.app`.
   - Download the file `google-services.json` and paste it inside the native folder:
     `/android-app/android/app/google-services.json`

---

## 🚀 Step 2: Running in Developer Mode via USB / Emulator

From your workspace or local terminal, trigger the automated hot-rebuilding packager:

```bash
# Extract the workspace files, enter folder and install packages
cd android-app
npm install

# Build and start the Expo React Native Metro Packager
npx expo start --android
```

The app will link native Java/Kotlin modules automatically, compile intermediate layout components, and boot directly onto your connected phone with native hot module reloading active.

---

## 📦 Step 3: Compiling the Final Standalone APK (Production Build)

To build a standalone APK without writing code, you can use either Expo Application Services (EAS) or compile directly via standard terminal Gradle.

### Method A: Gradle Local Compilation (Fastest Offline Build)

Ensure your Terminal has access to the Java Development Kit (JDK 17). Run the following commands:

```bash
# Navigate to the native android compiler
cd android/

# Grant execute permissions to the Gradle daemon wrapper (Linux/macOS only)
chmod +x gradlew

# Run the task to assemble a release binary APK
./gradlew assembleRelease
```

Upon successful completion, your signed standalone binary will be located at:
📁 `/android-app/android/app/build/outputs/apk/release/app-release.apk`

Copy this APK to your phone or share it directly with stakeholders to install immediately!

### Method B: Expo Cloud Cloud Compilation (EAS Build)

Ensure you have created a free Expo account, then run:

```bash
# Install EAS globally
npm install -g eas-cli

# Login to your account
eas login

# Initialize project config
eas build:configure

# Trigger the remote cloud Android build process
eas build --platform android --profile preview
```

Expo will safely compile your application inside a managed container and output a shareable link to download the native APK.

---

## 🚀 Key Features Implemented in Native Code:

* **Real RTL Arabic Formats**: Built from the ground up for Arabic RTL touch screen gestures.
* **Egyptian Pound (EGP) Localizer**: Currencies and statistical figures are dynamically formatted.
* **Camera OCR Receipts with Review Trigger**: Whenever a receipt scan is performed, the system validates the response code. If the confidence level is low (< 0.85), an **Editable Correction Overlay Screen** is presented so users can review, change fields, or manually edit values before saving to the ledger database.
* **Real Firebase Integration**: Auto-link transactions, budgets, settings, and login events securely via `firebase-analytics`, `firebase-auth`, and `firebase-firestore`.
* **Zero Dummy Data**: The mock simulator controls have been successfully removed, meaning the system expects direct local storage data or authentic files to ensure trustworthiness.
