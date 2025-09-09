/**
 * ServoCard component
 * Usage: createServoCard(servo)
 */

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
 * Increment or decrement servo angle by delta
 */
function incrementServoAngle(servoId, delta) {
    var slider = document.getElementById('slider-' + servoId);
    if (!slider) return;
    var newAngle = parseInt(slider.value) + delta;
    var min = parseInt(slider.min);
    var max = parseInt(slider.max);
    if (newAngle < min) newAngle = min;
    if (newAngle > max) newAngle = max;
    slider.value = newAngle;
    var posDisplay = document.getElementById('pos-' + servoId);
    if (posDisplay) posDisplay.textContent = newAngle + '°';
    setServoAngle(servoId, newAngle);
}

function createServoCard(servo) {
    const card = document.createElement('div');
    card.className = `servo-card ${!servo.enabled ? 'disabled' : ''}`;
    card.innerHTML = `
        <div class="servo-header">
            <div class="servo-title">${servo.name}</div>
            <div class="servo-channel">Ch ${servo.channel}</div>
        </div>
        
        <div class="position-display" id="pos-${servo.id}">
            ${servo.current_position}°
        </div>
        
        <div class="control-group">
            <label for="slider-${servo.id}">Angle (${servo.min_angle}° - ${servo.max_angle}°):</label>
            <input type="range" 
                   min="${servo.min_angle}" 
                   max="${servo.max_angle}" 
                   value="${servo.current_position}" 
                   class="slider" 
                   id="slider-${servo.id}" 
                   oninput="updateServoAngle('${servo.id}', this.value)"
                   ${!servo.enabled ? 'disabled' : ''}>
        </div>

        <div class="button-group">
            <button onclick="incrementServoAngle('${servo.id}', 1)" ${!servo.enabled ? 'disabled' : ''}>+1°</button>
            <button onclick="incrementServoAngle('${servo.id}', -1)" ${!servo.enabled ? 'disabled' : ''}>-1°</button>
        </div>
        
        <div class="button-group">
            <button onclick="setServoAngle('${servo.id}', ${servo.min_angle})" ${!servo.enabled ? 'disabled' : ''}>${servo.min_angle}°</button>
            <button onclick="setServoAngle('${servo.id}', ${Math.round((servo.min_angle + servo.max_angle) / 2)})" ${!servo.enabled ? 'disabled' : ''}>Center</button>
            <button onclick="setServoAngle('${servo.id}', ${servo.max_angle})" ${!servo.enabled ? 'disabled' : ''}>${servo.max_angle}°</button>
        </div>
        
        <div class="servo-actions">
            <button onclick="setServoAngle('${servo.id}', ${servo.open_angle})" ${!servo.enabled ? 'disabled' : ''} title="Open Valve">🟢 Open</button>
            <button onclick="setServoAngle('${servo.id}', ${servo.close_angle})" ${!servo.enabled ? 'disabled' : ''} title="Close Valve">🔴 Close</button>
            <button class="sweep-btn" onclick="sweepServo('${servo.id}')" ${!servo.enabled ? 'disabled' : ''}>🔄 Sweep</button>
            <button class="secondary" onclick="openEditModal('${servo.id}')" title="Edit Configuration">⚙️</button>
        </div>
        
        <div class="status" id="status-${servo.id}">Ready</div>
    `;
    
    return card;
}