# Direct APK Building Guide

## Building APK Without Android Studio

This guide shows you how to create a fully offline APK using command-line tools only.

### Option 1: Using Capacitor CLI (Recommended)

#### Prerequisites
- **Node.js and npm** (already installed)
- **Java JDK 11+** (for Gradle)
- **Android SDK** (command line only)

#### Step 1: Install Android SDK Command Line Tools

1. **Download Android SDK Command Line Tools**
   - Go to: https://developer.android.com/studio#command-tools
   - Download "Command line tools only" for your OS
   - Extract to a folder (e.g., `C:\Android\cmdline-tools`)

2. **Set Environment Variables**
   ```bash
   # Add to your PATH
   ANDROID_HOME=C:\Android
   ANDROID_SDK_ROOT=C:\Android
   PATH=%PATH%;%ANDROID_HOME%\cmdline-tools\latest\bin
   PATH=%PATH%;%ANDROID_HOME%\platform-tools
   ```

3. **Install Required SDK Components**
   ```bash
   # Accept licenses
   sdkmanager --licenses
   
   # Install required components
   sdkmanager "platform-tools" "platforms;android-33" "build-tools;33.0.0"
   ```

#### Step 2: Build APK with Capacitor

```bash
# Install Capacitor
npm install @capacitor/core @capacitor/cli @capacitor/android

# Initialize Capacitor
npx cap init HourMaster com.hourmaster.app --web-dir=dist

# Build web app
npm run build

# Add Android platform
npx cap add android

# Sync build
npx cap sync

# Build APK directly
cd android
./gradlew assembleDebug
```

**Your APK will be at:** `android/app/build/outputs/apk/debug/app-debug.apk`

### Option 2: Using Bubblewrap (Google's Tool)

#### Step 1: Install Bubblewrap

```bash
npm install -g @bubblewrap/cli
```

#### Step 2: Build APK

```bash
# Build web app first
npm run build

# Initialize Bubblewrap project
bubblewrap init --manifest https://your-site.com/manifest.json

# Build APK
bubblewrap build
```

### Option 3: Using PWA Builder (Online Tool)

#### Step 1: Deploy Your App

```bash
# Build the app
npm run build

# Deploy to any static hosting (GitHub Pages, Netlify, etc.)
# Example with GitHub Pages:
git add dist
git commit -m "Build for APK"
git push
```

#### Step 2: Use PWA Builder

1. Go to: https://www.pwabuilder.com/
2. Enter your deployed URL
3. Click "Build My PWA"
4. Download the generated APK

### Option 4: Using Capacitor with Docker (No Local Setup)

Create a `Dockerfile` for building APK:

```dockerfile
FROM openjdk:11-jdk

# Install Node.js
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
RUN apt-get install -y nodejs

# Install Android SDK
RUN apt-get update && apt-get install -y wget unzip
RUN wget https://dl.google.com/android/repository/commandlinetools-linux-8512546_latest.zip
RUN unzip commandlinetools-linux-8512546_latest.zip -d /opt/android
RUN mkdir -p /opt/android/cmdline-tools/latest
RUN mv /opt/android/cmdline-tools/* /opt/android/cmdline-tools/latest/

# Set environment variables
ENV ANDROID_HOME=/opt/android
ENV PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools

# Install Android SDK components
RUN yes | sdkmanager --licenses
RUN sdkmanager "platform-tools" "platforms;android-33" "build-tools;33.0.0"

# Copy project
WORKDIR /app
COPY . .

# Build APK
RUN npm install
RUN npm run build
RUN npx cap init HourMaster com.hourmaster.app --web-dir=dist
RUN npx cap add android
RUN npx cap sync
RUN cd android && ./gradlew assembleDebug

# Copy APK to host
VOLUME /app/android/app/build/outputs/apk/debug
```

Build with Docker:
```bash
docker build -t hourmaster-apk .
docker run -v $(pwd)/apk:/app/android/app/build/outputs/apk/debug hourmaster-apk
```

### Quick Automated Script

I've created a script that handles everything for you:

```bash
# Run the automated build script
npm run build:apk
```

This script will:
1. Install all dependencies
2. Set up Capacitor
3. Build your web app
4. Create Android project
5. Build APK
6. Show you where to find the APK

### APK Location

After building, your APK will be at:
```
HourMaster/android/app/build/outputs/apk/debug/app-debug.apk
```

### Testing Your APK

1. **Transfer APK** to your Android device
2. **Enable "Install from unknown sources"** in Android settings
3. **Install the APK**
4. **Test offline functionality**

### Troubleshooting

**Common Issues:**

1. **Java not found**: Install JDK 11+
2. **Android SDK not found**: Set ANDROID_HOME environment variable
3. **Gradle build fails**: Check Android SDK installation
4. **Permission denied**: Run `chmod +x android/gradlew` (Linux/Mac)

### No-Code Alternative

If you want the absolute easiest method:

1. **Deploy to GitHub Pages** (free)
2. **Use PWA Builder** (online tool)
3. **Download APK** directly

This requires no local setup at all!

### Summary

**Easiest Method:** Use the automated script `npm run build:apk`
**No Setup Required:** Deploy to GitHub Pages + PWA Builder
**Full Control:** Capacitor CLI with Android SDK

All methods create a fully offline APK that works without internet! 📱🔒 