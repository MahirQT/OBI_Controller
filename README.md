# OBI Robot Controller

A modern, cute, and responsive web-based controller for your ESP32-powered OBI robot! Easily control movement, trigger special actions, and monitor status from any device connected to your ESP32's WiFi network.

---

## 🚀 Features
- **Beautiful, modern UI** with responsive design
- **Keyboard and touch controls** for desktop and mobile
- **Real-time status** (connection, battery, WiFi)
- **Special actions**: Dance mode, object detection, emergency stop
- **ESP32 WiFi server integration** (works with ESP32 AP or STA mode)
- **Customizable IP address** via URL parameter

---

## 🛠️ Setup & Usage

### 1. **ESP32 Firmware**
- Flash your ESP32 with a web server sketch that supports these endpoints:
  - `GET /forward`, `GET /backward`, `GET /left`, `GET /right`, `GET /stop`
  - `GET /dance`, `GET /startDetection`, `GET /stopDetection`
  - `GET /status` (should return JSON with `{ status: 'ok', battery: 85 }`)
  - (Optional) `GET /info`, `GET /restart`

### 2. **Web Controller**
- Place the files (`index.html`, `style.css`, `script.js`) on your ESP32's SPIFFS/LittleFS, or serve them from any web server.
- (Optional) Place your own robot image as `obi-robot.png` if you want a custom icon.

### 3. **Connect & Control**
- Connect your device to the ESP32's WiFi (default AP: `ESP32_AP`, IP: `192.168.4.1`)
- Open a browser and go to `http://192.168.4.1` (or your ESP32's IP)
- Use the on-screen buttons or keyboard:
  - Arrow keys: Move
  - Spacebar: Stop
  - D: Dance
  - S: Start Detection
  - X: Stop Detection

---

## 📡 Customization
- Change the ESP32 IP by adding `?ip=YOUR_ESP32_IP` to the URL.
- Edit `style.css` for color/theme tweaks.
- Add more endpoints and buttons as needed for your robot's features.

---

## 🤖 Example ESP32 Endpoints
```cpp
server.on("/forward", HTTP_GET, [](){ /* Move forward */ });
server.on("/backward", HTTP_GET, [](){ /* Move backward */ });
server.on("/left", HTTP_GET, [](){ /* Turn left */ });
server.on("/right", HTTP_GET, [](){ /* Turn right */ });
server.on("/stop", HTTP_GET, [](){ /* Stop */ });
server.on("/dance", HTTP_GET, [](){ /* Dance mode */ });
server.on("/startDetection", HTTP_GET, [](){ /* Start detection */ });
server.on("/stopDetection", HTTP_GET, [](){ /* Stop detection */ });
server.on("/status", HTTP_GET, [](){ server.send(200, "application/json", "{\"status\":\"ok\",\"battery\":85}"); });
```

---

## 💡 Tips
- Works great on mobile and desktop!
- For best results, use a modern browser (Chrome, Edge, Firefox, Safari).
- You can further expand the UI for more robot features.

---

## 📄 License
MIT License. Free for personal and educational use. 