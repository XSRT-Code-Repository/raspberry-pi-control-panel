// Multi-Servo Controller JavaScript

// Global variables
let servos = {};
let isAnyServoMoving = false;
let configPanelVisible = false;

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    loadServos();
    updateConnectionStatus();
    setupEventListeners();
    
    // Periodic updates
    setInterval(updateConnectionStatus, 10000); // Every 10 seconds
    setInterval(updateAllPositions, 5000); // Every 5 seconds
});

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Add servo form
    document.getElementById('add-servo-form').addEventListener('submit', function(e) {
        e.preventDefault();
        addNewServo();
    });
    
    // Edit servo form
    document.getElementById('edit-servo-form').addEventListener('submit', function(e) {
        e.preventDefault();
        saveServoEdit();
    });
}

/**
 * Load all servos from server
 */
function loadServos() {
    fetch('/api/servos')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                servos = {};
                data.servos.forEach(servo => {
                    servos[servo.id] = servo;
                });
                renderServoControls();
                updateServoCount();
                loadServoConfigList();
            } else {
                showGlobalStatus('Failed to load servos: ' + data.error, 'error');
            }
        })
        .catch(error => {
            showGlobalStatus('Connection error', 'error');
            console.error('Error loading servos:', error);
        });
}

/**
 * Render servo control cards
 */
function renderServoControls() {
    const container = document.getElementById('servo-controls');
    container.innerHTML = '';
    
    Object.values(servos).forEach(servo => {
        if (servo.enabled) {
            const servoCard = createServoCard(servo);
            container.appendChild(servoCard);
        }
    });
    
    if (container.children.length === 0) {
        container.innerHTML = `
            <div class="no-servos">
                <h3>No servos configured</h3>
                <p>Click the Config button to add servos</p>
                <button onclick="toggleConfigPanel()" class="header-btn">⚙️ Add Servos</button>
            </div>
        `;
    }
}

// Import ServoCard component
// Assumes ServoCard.js is loaded before script.js or via a module system
// If using ES modules, use: import { createServoCard } from './ServoCard.js';

/**
 * Update servo angle from slider
 */
function updateServoAngle(servoId, angle) {
    document.getElementById(`pos-${servoId}`).textContent = angle + '°';
    
    // Debounce rapid updates
    clearTimeout(window[`timeout_${servoId}`]);
    window[`timeout_${servoId}`] = setTimeout(() => {
        setServoAngle(servoId, angle, false);
    }, 150);
}

/**
 * Set servo to specific angle
 */
function setServoAngle(servoId, angle, updateSlider = true) {
    if (isAnyServoMoving) return;
    
    setServoStatus(servoId, `Moving to ${angle}°...`, 'default');
    addPulseAnimation(servoId);
    
    if (updateSlider) {
        document.getElementById(`slider-${servoId}`).value = angle;
        document.getElementById(`pos-${servoId}`).textContent = angle + '°';
    }
    
    return fetch(`/api/servos/${servoId}/angle`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({angle: parseInt(angle)})
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            setServoStatus(servoId, `Position: ${data.angle}°`, 'success');
            servos[servoId].current_position = data.angle;
            return data;
        } else {
            setServoStatus(servoId, 'Error: ' + data.error, 'error');
            throw new Error(data.error);
        }
    })
    .catch(error => {
        setServoStatus(servoId, 'Connection error', 'error');
        console.error('Error:', error);
    });
}

/**
 * Sweep a specific servo
 */
function sweepServo(servoId) {
    if (isAnyServoMoving) {
        setServoStatus(servoId, 'Please wait for current movement', 'error');
        return;
    }
    
    isAnyServoMoving = true;
    setServoStatus(servoId, 'Sweeping...', 'default');
    
    fetch(`/api/servos/${servoId}/sweep`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({step: 15, delay: 0.05})
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            setServoStatus(servoId, 'Sweep complete', 'success');
            // Update position after sweep
            setTimeout(() => updateServoPosition(servoId), 500);
        } else {
            setServoStatus(servoId, 'Sweep failed: ' + data.message, 'error');
        }
    })
    .catch(error => {
        setServoStatus(servoId, 'Sweep error', 'error');
        console.error('Sweep error:', error);
    })
    .finally(() => {
        isAnyServoMoving = false;
    });
}

/**
 * Center all servos
 */
function centerAllServos() {
    if (isAnyServoMoving) {
        showGlobalStatus('Please wait for current movements', 'error');
        return;
    }
    
    showGlobalStatus('Centering all servos...', 'default');
    
    fetch('/api/servos/center_all', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'}
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showGlobalStatus('All servos centered', 'success');
            // Update all positions
            Object.keys(data.results).forEach(servoId => {
                const result = data.results[servoId];
                if (result.success && document.getElementById(`pos-${servoId}`)) {
                    document.getElementById(`pos-${servoId}`).textContent = result.angle + '°';
                    document.getElementById(`slider-${servoId}`).value = result.angle;
                    servos[servoId].current_position = result.angle;
                }
            });
        } else {
            showGlobalStatus('Failed to center servos', 'error');
        }
    })
    .catch(error => {
        showGlobalStatus('Center all failed', 'error');
        console.error('Center all error:', error);
    });
}

/**
 * Add new servo
 */
function addNewServo() {
    const form = document.getElementById('add-servo-form');
    const formData = new FormData(form);
    
    // Generate unique servo ID
    const servoId = 'servo_' + Date.now();
    
    const servoConfig = {
        name: document.getElementById('new-servo-name').value,
        channel: parseInt(document.getElementById('new-servo-channel').value),
        min_angle: parseInt(document.getElementById('new-servo-min-angle').value),
        max_angle: parseInt(document.getElementById('new-servo-max-angle').value),
        min_pulse_us: parseInt(document.getElementById('new-servo-min-pulse').value),
        max_pulse_us: parseInt(document.getElementById('new-servo-max-pulse').value),
        default_angle: parseInt(document.getElementById('new-servo-default').value),
        enabled: document.getElementById('new-servo-enabled').checked
    };
    
    fetch('/api/servos', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({servo_id: servoId, config: servoConfig})
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showGlobalStatus('Servo added successfully', 'success');
            form.reset();
            loadServos(); // Reload to show new servo
        } else {
            showGlobalStatus('Failed to add servo: ' + data.message, 'error');
        }
    })
    .catch(error => {
        showGlobalStatus('Add servo error', 'error');
        console.error('Add servo error:', error);
    });
}

/**
 * Open edit modal for servo
 */
function openEditModal(servoId) {
    const servo = servos[servoId];
    if (!servo) return;
    
    // Populate form
    document.getElementById('edit-servo-id').value = servoId;
    document.getElementById('edit-servo-name').value = servo.name;
    document.getElementById('edit-servo-channel').value = servo.channel;
    document.getElementById('edit-servo-min-angle').value = servo.min_angle;
    document.getElementById('edit-servo-max-angle').value = servo.max_angle;
    document.getElementById('edit-servo-min-pulse').value = servo.min_pulse_us || 500;
    document.getElementById('edit-servo-max-pulse').value = servo.max_pulse_us || 2500;
    document.getElementById('edit-servo-default').value = servo.default_angle || 90;
    document.getElementById('edit-servo-enabled').checked = servo.enabled;
    
    // Show modal
    document.getElementById('edit-modal').classList.remove('hidden');
}

/**
 * Close edit modal
 */
function closeEditModal() {
    document.getElementById('edit-modal').classList.add('hidden');
}

/**
 * Save servo edit
 */
function saveServoEdit() {
    const servoId = document.getElementById('edit-servo-id').value;
    
    const updatedConfig = {
        name: document.getElementById('edit-servo-name').value,
        channel: parseInt(document.getElementById('edit-servo-channel').value),
        min_angle: parseInt(document.getElementById('edit-servo-min-angle').value),
        max_angle: parseInt(document.getElementById('edit-servo-max-angle').value),
        min_pulse_us: parseInt(document.getElementById('edit-servo-min-pulse').value),
        max_pulse_us: parseInt(document.getElementById('edit-servo-max-pulse').value),
        default_angle: parseInt(document.getElementById('edit-servo-default').value),
        enabled: document.getElementById('edit-servo-enabled').checked
    };
    
    fetch(`/api/servos/${servoId}`, {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(updatedConfig)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showGlobalStatus('Servo updated successfully', 'success');
            closeEditModal();
            loadServos(); // Reload to show changes
        } else {
            showGlobalStatus('Failed to update servo: ' + data.message, 'error');
        }
    })
    .catch(error => {
        showGlobalStatus('Update servo error', 'error');
        console.error('Update servo error:', error);
    });
}

/**
 * Delete servo
 */
function deleteServo(servoId) {
    if (!confirm(`Are you sure you want to delete ${servos[servoId].name}?`)) {
        return;
    }
    
    fetch(`/api/servos/${servoId}`, {
        method: 'DELETE'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showGlobalStatus('Servo deleted successfully', 'success');
            loadServos(); // Reload to show changes
        } else {
            showGlobalStatus('Failed to delete servo: ' + data.message, 'error');
        }
    })
    .catch(error => {
        showGlobalStatus('Delete servo error', 'error');
        console.error('Delete servo error:', error);
    });
}

/**
 * Load servo configuration list
 */
function loadServoConfigList() {
    const container = document.getElementById('servo-config-list');
    container.innerHTML = '';
    
    Object.entries(servos).forEach(([servoId, servo]) => {
        const item = document.createElement('div');
        item.className = 'servo-config-item';
        item.innerHTML = `
            <div class="servo-config-info">
                <div class="servo-config-name">${servo.name} ${!servo.enabled ? '(Disabled)' : ''}</div>
                <div class="servo-config-details">
                    Channel ${servo.channel} | ${servo.min_angle}°-${servo.max_angle}° | 
                    ${servo.min_pulse_us || 500}-${servo.max_pulse_us || 2500}μs
                </div>
            </div>
            <div class="servo-config-actions">
                <button class="edit-btn" onclick="openEditModal('${servoId}')">✏️ Edit</button>
                <button class="delete-btn" onclick="deleteServo('${servoId}')">🗑️ Delete</button>
            </div>
        `;
        container.appendChild(item);
    });
}

/**
 * Toggle configuration panel
 */
function toggleConfigPanel() {
    configPanelVisible = !configPanelVisible;
    const panel = document.getElementById('config-panel');
    
    if (configPanelVisible) {
        panel.classList.remove('hidden');
        loadServoConfigList();
    } else {
        panel.classList.add('hidden');
    }
}

/**
 * Refresh servos from server
 */
function refreshServos() {
    showGlobalStatus('Refreshing...', 'default');
    loadServos();
}

/**
 * Update individual servo position
 */
function updateServoPosition(servoId) {
    fetch(`/api/servos/${servoId}/position`)
        .then(response => response.json())
        .then(data => {
            if (data.success && document.getElementById(`pos-${servoId}`)) {
                document.getElementById(`pos-${servoId}`).textContent = data.angle + '°';
                document.getElementById(`slider-${servoId}`).value = data.angle;
                servos[servoId].current_position = data.angle;
            }
        })
        .catch(error => {
            console.error(`Error updating position for ${servoId}:`, error);
        });
}

/**
 * Update all servo positions
 */
function updateAllPositions() {
    fetch('/api/servos/positions')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                Object.entries(data.positions).forEach(([servoId, angle]) => {
                    if (document.getElementById(`pos-${servoId}`)) {
                        document.getElementById(`pos-${servoId}`).textContent = angle + '°';
                        document.getElementById(`slider-${servoId}`).value = angle;
                        servos[servoId].current_position = angle;
                    }
                });
            }
        })
        .catch(error => {
            // Silently fail for background updates
            console.error('Error updating positions:', error);
        });
}

/**
 * Update connection status
 */
function updateConnectionStatus() {
    fetch('/api/health')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const statusIcon = data.servo_connected ? '🟢' : '🔴';
                const statusText = data.servo_connected ? 'Connected' : 'Disconnected';
                document.getElementById('connection-status').innerHTML = `${statusIcon} ${statusText}`;
                updateServoCount(data.active_servos);
            }
        })
        .catch(error => {
            document.getElementById('connection-status').innerHTML = '🔴 Connection Error';
            console.error('Health check error:', error);
        });
}

/**
 * Update servo count display
 */
function updateServoCount(activeCount = null) {
    const count = activeCount !== null ? activeCount : Object.values(servos).filter(s => s.enabled).length;
    document.getElementById('servo-count').textContent = `${count} servo${count !== 1 ? 's' : ''} active`;
}

/**
 * Set status for specific servo
 */
function setServoStatus(servoId, message, type = 'default') {
    const statusEl = document.getElementById(`status-${servoId}`);
    if (!statusEl) return;
    
    statusEl.textContent = message;
    statusEl.className = `status ${type}`;
}

/**
 * Show global status message
 */
function showGlobalStatus(message, type = 'default') {
    // Create temporary status element
    const existingStatus = document.querySelector('.global-message');
    if (existingStatus) {
        existingStatus.remove();
    }
    
    const statusEl = document.createElement('div');
    statusEl.className = `global-message status ${type}`;
    statusEl.textContent = message;
    statusEl.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 1001;
        min-width: 250px;
        box-shadow: 0 8px 25px rgba(0,0,0,0.3);
    `;
    
    document.body.appendChild(statusEl);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
        if (statusEl.parentNode) {
            statusEl.remove();
        }
    }, 3000);
}

/**
 * Add pulse animation to position display
 */
function addPulseAnimation(servoId) {
    const posDisplay = document.getElementById(`pos-${servoId}`);
    if (posDisplay) {
        posDisplay.classList.add('updating');
        setTimeout(() => {
            posDisplay.classList.remove('updating');
        }, 500);
    }
}

/**
 * Keyboard shortcuts
 */
document.addEventListener('keydown', function(event) {
    if (isAnyServoMoving) return;
    
    // Don't trigger if user is typing in an input field
    if (event.target.tagName === 'INPUT') return;
    
    switch(event.key.toLowerCase()) {
        case 'c':
            centerAllServos();
            break;
        case 'r':
            refreshServos();
            break;
        case 'escape':
            if (configPanelVisible) {
                toggleConfigPanel();
            }
            closeEditModal();
            break;
    }
});

/**
 * Close modal when clicking outside
 */
document.addEventListener('click', function(event) {
    const modal = document.getElementById('edit-modal');
    if (event.target === modal) {
        closeEditModal();
    }
});

/**
 * Validate form inputs
 */
function validateServoForm(formId) {
    const form = document.getElementById(formId);
    const inputs = form.querySelectorAll('input[required]');
    
    for (let input of inputs) {
        if (!input.value.trim()) {
            input.focus();
            showGlobalStatus(`Please fill in ${input.previousElementSibling.textContent}`, 'error');
            return false;
        }
    }
    
    return true;
}

/**
 * Auto-update slider ranges when min/max angles change
 */
document.addEventListener('input', function(event) {
    if (event.target.id === 'new-servo-min-angle' || event.target.id === 'new-servo-max-angle') {
        const minAngle = parseInt(document.getElementById('new-servo-min-angle').value) || 0;
        const maxAngle = parseInt(document.getElementById('new-servo-max-angle').value) || 180;
        const defaultInput = document.getElementById('new-servo-default');
        
        defaultInput.min = minAngle;
        defaultInput.max = maxAngle;
        
        // Adjust default if outside new range
        const currentDefault = parseInt(defaultInput.value);
        if (currentDefault < minAngle) defaultInput.value = minAngle;
        if (currentDefault > maxAngle) defaultInput.value = maxAngle;
    }
    
    if (event.target.id === 'edit-servo-min-angle' || event.target.id === 'edit-servo-max-angle') {
        const minAngle = parseInt(document.getElementById('edit-servo-min-angle').value) || 0;
        const maxAngle = parseInt(document.getElementById('edit-servo-max-angle').value) || 180;
        const defaultInput = document.getElementById('edit-servo-default');
        
        defaultInput.min = minAngle;
        defaultInput.max = maxAngle;
        
        // Adjust default if outside new range
        const currentDefault = parseInt(defaultInput.value);
        if (currentDefault < minAngle) defaultInput.value = minAngle;
        if (currentDefault > maxAngle) defaultInput.value = maxAngle;
    }
});