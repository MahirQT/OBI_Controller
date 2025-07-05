function sendCommand(cmd) {
  fetch("/" + cmd)
    .then(res => res.text())
    .then(data => console.log("Sent command:", cmd, "| Response:", data))
    .catch(err => console.error("Error sending command:", cmd, err));
}
