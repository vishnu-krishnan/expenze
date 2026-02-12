# Flutter Run & Debug Guide
================================================================================

Date: 2026-02-12

## Running Your Flutter App
================================================================================

### Method 1: Command Line (Recommended for Learning)

**Basic Run:**
```bash
cd /home/seq_vishnu/WORK/RnD/expenze/mobile
flutter run
```

**Run on Specific Device:**
```bash
# List all devices
flutter devices

# Run on your Vivo phone specifically
flutter run -d 1592460721000B5

# Or use device name
flutter run -d I2202
```

**Run in Different Modes:**
```bash
# Debug mode (default, with hot reload)
flutter run

# Profile mode (for performance testing)
flutter run --profile

# Release mode (optimized, no debugging)
flutter run --release
```

### Method 2: VS Code (Best for Development)

1. **Install Flutter Extension:**
   - Open VS Code
   - Go to Extensions (Ctrl+Shift+X)
   - Search for "Flutter"
   - Install "Flutter" by Dart-Code

2. **Open Project:**
   - File → Open Folder
   - Select `/home/seq_vishnu/WORK/RnD/expenze/mobile`

3. **Select Device:**
   - Click on device selector in bottom-right corner
   - Choose "I2202 (mobile)"

4. **Run:**
   - Press F5 (or Run → Start Debugging)
   - Or click "Run" above `main()` function in `lib/main.dart`

## Hot Reload & Hot Restart
================================================================================

### Hot Reload (Fast - Preserves State)
**What it does:** Updates UI instantly without losing app state

**Command Line:**
- Press `r` in the terminal while app is running

**VS Code:**
- Save file (Ctrl+S) - auto hot reload
- Or click lightning bolt icon
- Or Ctrl+F5

**When to use:**
- UI changes
- Widget updates
- Style modifications
- Most code changes

### Hot Restart (Medium - Resets State)
**What it does:** Restarts app from scratch, loses state

**Command Line:**
- Press `R` (capital R) in terminal

**VS Code:**
- Click restart icon
- Or Ctrl+Shift+F5

**When to use:**
- Changing `main()` function
- Modifying app initialization
- State is corrupted
- Hot reload doesn't work

### Full Restart (Slow - Complete Rebuild)
**What it does:** Completely rebuilds and reinstalls app

**Command Line:**
```bash
# Stop current run (press 'q')
# Then run again
flutter run
```

**VS Code:**
- Stop debugging (Shift+F5)
- Start again (F5)

**When to use:**
- Adding new dependencies
- Changing native code (Android/iOS)
- Modifying `pubspec.yaml`
- Build errors

## Debugging
================================================================================

### Debug in Command Line

**View Logs:**
```bash
# While app is running, logs appear automatically
flutter run

# In another terminal, view detailed logs
flutter logs

# Or use ADB directly
adb logcat | grep flutter
```

**Debug Commands (while running):**
```
r - Hot reload
R - Hot restart
p - Show performance overlay
o - Toggle platform (Android/iOS)
w - Dump widget hierarchy
t - Dump rendering tree
L - Dump layer tree
S - Dump accessibility tree
i - Toggle widget inspector
q - Quit
h - Help (show all commands)
```

### Debug in VS Code

**Set Breakpoints:**
1. Click left of line number (red dot appears)
2. Run in debug mode (F5)
3. App pauses when breakpoint is hit

**Debug Panel:**
- Variables: See current values
- Call Stack: See function call chain
- Watch: Monitor specific variables
- Debug Console: Execute Dart code

**Debug Actions:**
- Continue (F5): Resume execution
- Step Over (F10): Execute current line
- Step Into (F11): Go into function
- Step Out (Shift+F11): Exit function
- Restart (Ctrl+Shift+F5): Restart app

### Print Debugging

**Simple Logging:**
```dart
print('Debug message: $variableName');
```

**Better Logging with debugPrint:**
```dart
import 'package:flutter/foundation.dart';

debugPrint('This is a debug message');
```

**Using Logger Package:**
```dart
import 'package:logger/logger.dart';

final logger = Logger();

logger.d('Debug message');
logger.i('Info message');
logger.w('Warning message');
logger.e('Error message');
```

### Widget Inspector

**Enable Inspector:**
```bash
# While app is running, press 'i'
```

**In VS Code:**
- Click "Flutter Inspector" in sidebar
- See widget tree
- Inspect properties
- View layout constraints

**Features:**
- Select widget mode: Click widget on phone to see code
- Show paint baselines: See text alignment
- Show performance overlay: FPS counter
- Debug paint: See widget boundaries

## Common Debugging Scenarios
================================================================================

### Scenario 1: App Crashes on Startup

**Check Logs:**
```bash
flutter run --verbose
```

**Look for:**
- Exception stack traces
- Missing dependencies
- Permission errors

**Common Fixes:**
```bash
# Clean and rebuild
flutter clean
flutter pub get
flutter run
```

### Scenario 2: UI Not Updating

**Try:**
1. Hot reload: Press `r`
2. Hot restart: Press `R`
3. Full restart: Stop and run again

**Check:**
- Are you using `const` widgets? (prevents rebuild)
- Is state management working?
- Are you calling `setState()`?

### Scenario 3: Performance Issues

**Enable Performance Overlay:**
```bash
# While running, press 'p'
```

**Check:**
- Green bars: Good (60 FPS)
- Red bars: Bad (frame drops)

**Profile Mode:**
```bash
flutter run --profile
```

**Analyze:**
```bash
flutter analyze
```

### Scenario 4: Network Errors

**Check API Connection:**
```dart
try {
  final response = await dio.get('https://your-api.com/endpoint');
  print('Response: ${response.data}');
} catch (e) {
  print('Error: $e');
}
```

**View Network Logs:**
```bash
adb logcat | grep -i http
```

**Common Issues:**
- CORS errors (backend configuration)
- SSL certificate errors
- Timeout errors
- Wrong API URL

### Scenario 5: Permission Errors (SMS)

**Check Permissions:**
```dart
import 'package:permission_handler/permission_handler.dart';

final status = await Permission.sms.status;
print('SMS Permission: $status');

if (!status.isGranted) {
  await Permission.sms.request();
}
```

**View Permission Logs:**
```bash
adb logcat | grep -i permission
```

## Advanced Debugging
================================================================================

### DevTools

**Launch DevTools:**
```bash
# While app is running
flutter pub global activate devtools
flutter pub global run devtools
```

**Features:**
- Inspector: Widget tree visualization
- Timeline: Performance profiling
- Memory: Memory usage analysis
- Network: HTTP request monitoring
- Logging: Structured logs
- Debugger: Advanced debugging

### Debugging Native Code

**Android Logs:**
```bash
adb logcat
```

**Filter by App:**
```bash
adb logcat | grep com.expenze.expenze_mobile
```

**Clear Logs:**
```bash
adb logcat -c
```

### Remote Debugging

**Get Debug URL:**
```bash
flutter run --verbose
# Look for: "An Observatory debugger and profiler on I2202 is available at: http://..."
```

**Open in Browser:**
- Copy the URL
- Open in Chrome
- Access DevTools

## Build and Install
================================================================================

### Debug Build

**Build APK:**
```bash
flutter build apk --debug
```

**Location:**
```
build/app/outputs/flutter-apk/app-debug.apk
```

**Install:**
```bash
flutter install
# Or
adb install build/app/outputs/flutter-apk/app-debug.apk
```

### Release Build

**Build APK:**
```bash
flutter build apk --release
```

**Location:**
```
build/app/outputs/flutter-apk/app-release.apk
```

**Install:**
```bash
adb install build/app/outputs/flutter-apk/app-release.apk
```

### App Bundle (for Play Store)

**Build:**
```bash
flutter build appbundle --release
```

**Location:**
```
build/app/outputs/bundle/release/app-release.aab
```

## Troubleshooting
================================================================================

### Build Fails

**Clean Build:**
```bash
flutter clean
rm -rf build/
flutter pub get
flutter run
```

**Gradle Issues:**
```bash
cd android
./gradlew clean
cd ..
flutter run
```

### Device Not Detected

**Check Connection:**
```bash
adb devices
```

**Restart ADB:**
```bash
adb kill-server
adb start-server
flutter devices
```

### Hot Reload Not Working

**Reasons:**
- Changed `main()` function → Use Hot Restart (R)
- Modified native code → Full restart needed
- Added dependencies → Restart needed

**Fix:**
```bash
# Press 'R' for hot restart
# Or stop and run again
```

### Out of Memory

**Increase Gradle Memory:**
Edit `android/gradle.properties`:
```properties
org.gradle.jvmargs=-Xmx2048m -XX:MaxPermSize=512m
```

**Clean Cache:**
```bash
flutter clean
rm -rf ~/.gradle/caches/
```

## Performance Optimization
================================================================================

### Check Performance

**Performance Overlay:**
```bash
# Press 'p' while running
```

**Profile Mode:**
```bash
flutter run --profile
```

**Analyze:**
```bash
flutter analyze
```

### Common Optimizations

**Use const Constructors:**
```dart
const Text('Hello'); // Better
Text('Hello');        // Rebuilds unnecessarily
```

**Avoid Rebuilding:**
```dart
// Bad
Widget build(BuildContext context) {
  return Column(
    children: [
      ExpensiveWidget(),  // Rebuilds every time
    ],
  );
}

// Good
final expensiveWidget = ExpensiveWidget();
Widget build(BuildContext context) {
  return Column(
    children: [
      expensiveWidget,  // Reuses instance
    ],
  );
}
```

**Lazy Loading:**
```dart
ListView.builder(  // Only builds visible items
  itemCount: 1000,
  itemBuilder: (context, index) => ListTile(title: Text('Item $index')),
)
```

## Quick Reference
================================================================================

### Essential Commands

```bash
# Run app
flutter run

# Hot reload
r

# Hot restart
R

# View logs
flutter logs

# List devices
flutter devices

# Build APK
flutter build apk --release

# Clean project
flutter clean

# Get dependencies
flutter pub get

# Analyze code
flutter analyze

# Run tests
flutter test
```

### VS Code Shortcuts

```
F5              - Start debugging
Shift+F5        - Stop debugging
Ctrl+F5         - Run without debugging
Ctrl+Shift+F5   - Restart debugging
F10             - Step over
F11             - Step into
Shift+F11       - Step out
Ctrl+S          - Save & hot reload
```

### Debug Commands (while running)

```
r - Hot reload
R - Hot restart
p - Performance overlay
i - Widget inspector
w - Widget hierarchy
q - Quit
h - Help
```

## Next Steps
================================================================================

1. **Run the Demo App:**
   ```bash
   cd /home/seq_vishnu/WORK/RnD/expenze/mobile
   flutter run
   ```

2. **Try Hot Reload:**
   - Edit `lib/main.dart`
   - Change the title text
   - Press `r`
   - See instant update on phone

3. **Install VS Code Extension:**
   - Better debugging experience
   - Visual breakpoints
   - Widget inspector

4. **Start Building:**
   - Create your first screen
   - Connect to backend API
   - Test on physical device

## Document Control
================================================================================

Version: 1.0
Status: Active
Date: 2026-02-12
Owner: Development Team

Change Log:
- 2026-02-12: Initial creation - Complete run and debug guide for Flutter
