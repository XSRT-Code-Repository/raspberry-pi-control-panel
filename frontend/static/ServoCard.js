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
    card.className = 'servo-card';
    card.style.maxWidth = '340px';
    card.style.width = '100%';
    card.innerHTML = `
        <div class="servo-header">
            <div class="servo-title">${servo.name}</div>
            <div class="servo-channel">Ch ${servo.channel}</div>
        </div>
        
        <div class="position-display" id="pos-${servo.id}">
            ${servo.current_position}°
        </div>
        
        <div class="control-group">
            <label for="slider-${servo.id}">Angle (${servo.close_angle}° - ${servo.open_angle}°):</label>
            <input type="range" 
                   min="${servo.close_angle}" 
                   max="${servo.open_angle}" 
                   value="${servo.current_position}" 
                   class="slider" 
                   id="slider-${servo.id}" 
                   oninput="updateServoAngle('${servo.id}', this.value)">
        </div>

        <div class="button-group">
            <button onclick="incrementServoAngle('${servo.id}', 1)">+1°</button>
            <button onclick="incrementServoAngle('${servo.id}', -1)">-1°</button>
        </div>
        
        <div class="button-group">
            <button onclick="setServoAngle('${servo.id}', ${servo.open_angle})" title="Open Valve">🟢 Open</button>
            <button onclick="setServoAngle('${servo.id}', ${servo.close_angle})" title="Close Valve">🔴 Close</button>
            <button class="secondary" onclick="openEditModal('${servo.id}')" title="Edit Configuration">⚙️</button>
        </div>
        
        <div class="status" id="status-${servo.id}">Ready</div>
    `;
    
    return card;
}