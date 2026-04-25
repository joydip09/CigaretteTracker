# 🚬 Cigarette Tracker

A simple and focused **React Native app** to track daily cigarette usage, monitor spending, and stay within your limits.

---

## ✨ Features

- 📊 Track daily cigarette count
- 💰 Automatic cost calculation
- ⏱ Undo last log (within time window)
- 🎯 Daily goal tracking
- 📈 Progress visualization
- ⚡ Smooth animations

---

## 🛠 Tech Stack

- React Native (CLI)
- TypeScript
- Context API
- AsyncStorage
- React Navigation

---

## 🚀 Getting Started

> Make sure your environment is set up properly:
> 👉 https://reactnative.dev/docs/set-up-your-environment

---

## ▶️ Step 1: Start Metro

```sh
npm start
```

---

## 📱 Step 2: Run on Android

Make sure:

- USB Debugging is ON
- Device is connected (`adb devices`)

Then run:

```sh
npx react-native run-android
```

---

## 🔁 Development Tips

- Reload app: Press **R twice**
- Open dev menu: `Ctrl + M`
- Reset cache if needed:

```sh
npx react-native start --reset-cache
```

---

## 🏗 Clean Build (Fix most issues)

```sh
rm -rf node_modules android/.gradle android/build android/app/build
npm install
cd android && ./gradlew clean && cd ..
npx react-native run-android
```

---

## 📦 Release APK

You can download the latest release APK here:

👉 **[Download APK](https://github.com/joydip09/CigaretteTracker/releases/latest)**

---

### 🔨 How to build APK

Run:

```sh
cd android
./gradlew assembleRelease
```

APK will be generated at:

```sh
android/app/build/outputs/apk/release/app-release.apk
```

---

## 📁 Project Structure

```sh
src/
  components/
  screens/
  context/
android/
ios/
```

---

## ⚠️ Notes

- Android-first project (iOS not configured)
- Uses local storage (no cloud sync yet)

---

## 🧠 Future Improvements

- 🔔 Notifications
- ☁️ Cloud backup
- 📊 Advanced analytics
- 🎨 Theme customization

---

## 🤝 Contributing

Feel free to fork and improve the project.

---

## 📄 License

This project is open-source.
