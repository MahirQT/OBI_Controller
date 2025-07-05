// ESP32 Robot Controller JavaScript
class ESP32OBIController {
  constructor() {
    this.isConnected = false;
    this.currentCommand = null;
    this.esp32IP = this.getESP32IP();
    this.init();
  }

  getESP32IP() {
    const urlParams = new URLSearchParams(window.location.search);
    const ip = urlParams.get('ip') || '192.168.4.1'; // Default ESP32 AP IP
    return ip;
  }

  init() {
    this.setupEventListeners();
    this.updateStatus();
    this.startConnectionCheck();
    this.displayESP32Info();
  }

  setupEventListeners() {
    const buttons = document.querySelectorAll('.arrow, .action-btn');
    buttons.forEach(button => {
      button.addEventListener('mousedown', () => this.addPressEffect(button));
      button.addEventListener('mouseup', () => this.removePressEffect(button));
      button.addEventListener('mouseleave', () => this.removePressEffect(button));
    });

    document.addEventListener('keydown', (e) => this.handleKeyPress(e));
    document.addEventListener('keyup', (e) => this.handleKeyRelease(e));

    buttons.forEach(button => {
      button.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.addPressEffect(button);
      });
      button.addEventListener('touchend', (e) => {
        e.preventDefault();
        this.removePressEffect(button);
      });
    });
  }

  addPressEffect(button) {
    button.style.transform = 'translateY(2px) scale(0.98)';
  }

  removePressEffect(button) {
    button.style.transform = '';
  }

  handleKeyPress(e) {
    const keyCommands = {
      'ArrowUp': 'forward',
      'ArrowDown': 'backward',
      'ArrowLeft': 'left',
      'ArrowRight': 'right',
      ' ': 'stop', // Spacebar
      'KeyD': 'dance',
      'KeyS': 'startDetection',
      'KeyX': 'stopDetection'
    };

    if (keyCommands[e.code]) {
      e.preventDefault();
      this.sendCommand(keyCommands[e.code]);
    }
  }

  handleKeyRelease(e) {
    // Auto-stop when movement keys are released
    const movementKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
    if (movementKeys.includes(e.code)) {
      this.sendCommand('stop');
    }
  }

  async sendCommand(cmd) {
    if (this.currentCommand === cmd) return; // Prevent spam
    
    this.currentCommand = cmd;
    this.showCommandFeedback(cmd);

    try {
      // ESP32 typically uses GET requests for simple commands
      const response = await fetch(`http://${this.esp32IP}/${cmd}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // Add timeout for ESP32
        signal: AbortSignal.timeout(5000)
      });

      if (response.ok) {
        const data = await response.text();
        console.log("✅ Command sent to ESP32:", cmd, "| Response:", data);
        this.updateStatus(true);
        this.showSuccessMessage(cmd);
        this.updateESP32Status(data);
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (err) {
      console.error("❌ Error sending command to ESP32:", cmd, err);
      this.updateStatus(false);
      this.showErrorMessage(cmd);
      
      // If it's a network error, show connection help
      if (err.name === 'TypeError' || err.name === 'AbortError') {
        this.showConnectionHelp();
      }
    } finally {
      setTimeout(() => {
        this.currentCommand = null;
      }, 100);
    }
  }

  showCommandFeedback(cmd) {
    const button = document.querySelector(`[onclick*="${cmd}"]`);
    if (button) {
      button.style.animation = 'pulse 0.5s ease-in-out';
      setTimeout(() => {
        button.style.animation = '';
      }, 500);
    }
  }

  showSuccessMessage(cmd) {
    this.showNotification(`✅ ${cmd} sent to ESP32 successfully!`, 'success');
  }

  showErrorMessage(cmd) {
    this.showNotification(`❌ Failed to send ${cmd} to ESP32`, 'error');
  }

  showConnectionHelp() {
    this.showNotification(`🔌 Cannot connect to ESP32. Check WiFi connection to ESP32_AP`, 'warning');
  }

  showNotification(message, type) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    const bgColor = type === 'success' ? '#2ecc71' : 
                   type === 'error' ? '#e74c3c' : 
                   type === 'warning' ? '#f39c12' : '#3498db';
    
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 15px 20px;
      border-radius: 10px;
      color: white;
      font-weight: 500;
      z-index: 1000;
      animation: slideInRight 0.3s ease-out;
      background: ${bgColor};
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      max-width: 300px;
      word-wrap: break-word;
    `;

    document.body.appendChild(notification);

    // Remove notification after 4 seconds
    setTimeout(() => {
      notification.style.animation = 'slideOutRight 0.3s ease-in';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 4000);
  }

  updateStatus(connected = true) {
    this.isConnected = connected;
    const statusDot = document.querySelector('.status-dot');
    const statusText = document.querySelector('.status-indicator span');
    
    if (statusDot && statusText) {
      if (connected) {
        statusDot.className = 'status-dot online';
        statusText.textContent = 'ESP32 Online';
      } else {
        statusDot.className = 'status-dot offline';
        statusText.textContent = 'ESP32 Offline';
      }
    }
  }

  updateESP32Status(data) {
    // Parse ESP32 response and update UI accordingly
    try {
      const response = JSON.parse(data);
      if (response.battery) {
        this.updateBatteryLevel(response.battery);
      }
      if (response.status) {
        this.updateStatus(response.status === 'ok');
      }
    } catch (e) {
      // If response is not JSON, just log it
      console.log('ESP32 Response:', data);
    }
  }

  startConnectionCheck() {
    // Check ESP32 connection every 10 seconds
    setInterval(async () => {
      try {
        const response = await fetch(`http://${this.esp32IP}/status`, {
          method: 'GET',
          signal: AbortSignal.timeout(3000)
        });
        this.updateStatus(response.ok);
      } catch (err) {
        this.updateStatus(false);
      }
    }, 10000);
  }

  // Battery level from ESP32 or simulation
  updateBatteryLevel(level = null) {
    const batteryIcon = document.querySelector('.battery-indicator i');
    const batteryText = document.querySelector('.battery-indicator span');
    
    if (batteryIcon && batteryText) {
      // Use provided level or simulate
      const batteryLevel = level || Math.floor(Math.random() * 30) + 70; // 70-100%
      batteryText.textContent = `${batteryLevel}%`;
      
      // Update battery icon based on level
      batteryIcon.className = batteryLevel > 80 ? 'fas fa-battery-full' :
                             batteryLevel > 60 ? 'fas fa-battery-three-quarters' :
                             batteryLevel > 40 ? 'fas fa-battery-half' :
                             batteryLevel > 20 ? 'fas fa-battery-quarter' : 'fas fa-battery-empty';
    }
  }

  displayESP32Info() {
    // Update info card with ESP32-specific information
    const infoCard = document.querySelector('.info-card p');
    if (infoCard) {
      infoCard.innerHTML = `
        OBI is powered by an ESP32 microcontroller with WiFi capabilities. 
        Connect to the ESP32_AP WiFi network to control OBI remotely. 
        Current IP: <strong>${this.esp32IP}</strong><br><br>
        <small>💡 Tip: Use arrow keys or tap buttons to control OBI</small>
      `;
    }
  }

  // ESP32-specific functions
  async getESP32Info() {
    try {
      const response = await fetch(`http://${this.esp32IP}/info`);
      const data = await response.json();
      console.log('ESP32 Info:', data);
      return data;
    } catch (err) {
      console.error('Failed to get ESP32 info:', err);
    }
  }

  async restartESP32() {
    try {
      await fetch(`http://${this.esp32IP}/restart`);
      this.showNotification('🔄 ESP32 restarting...', 'info');
    } catch (err) {
      this.showErrorMessage('restart');
    }
  }
}

// Initialize the controller when the page loads
document.addEventListener('DOMContentLoaded', () => {
  window.esp32Controller = new ESP32OBIController();
  
  // Update battery level every 30 seconds
  setInterval(() => {
    window.esp32Controller.updateBatteryLevel();
  }, 30000);
  
  // Initial battery update
  window.esp32Controller.updateBatteryLevel();
});

// Legacy function for backward compatibility
function sendCommand(cmd) {
  if (window.esp32Controller) {
    window.esp32Controller.sendCommand(cmd);
  }
}

// Add CSS animations for notifications
const style = document.createElement('style');
style.textContent = `
  @keyframes slideInRight {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOutRight {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }
  
  .status-dot.offline {
    background: #e74c3c;
    box-shadow: 0 0 10px #e74c3c;
  }

  /* ESP32 specific styles */
  .esp32-info {
    background: rgba(255,255,255,0.1);
    border-radius: 10px;
    padding: 15px;
    margin: 10px 0;
    font-size: 0.9rem;
  }
`;
document.head.appendChild(style);
