/**
 * ServoCard component
 * Usage: createServoCard(servo)
 */
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
            <button onclick="setServoAngle('${servo.id}', ${servo.min_angle})" ${!servo.enabled ? 'disabled' : ''}>${servo.min_angle}°</button>
            <button onclick="setServoAngle('${servo.id}', ${Math.round((servo.min_angle + servo.max_angle) / 2)})" ${!servo.enabled ? 'disabled' : ''}>Center</button>
            <button onclick="setServoAngle('${servo.id}', ${servo.max_angle})" ${!servo.enabled ? 'disabled' : ''}>${servo.max_angle}°</button>
        </div>
        
        <div class="servo-actions">
            <button class="sweep-btn" onclick="sweepServo('${servo.id}')" ${!servo.enabled ? 'disabled' : ''}>🔄 Sweep</button>
            <button class="secondary" onclick="openEditModal('${servo.id}')" title="Edit Configuration">⚙️</button>
        </div>
        
        <div class="status" id="status-${servo.id}">Ready</div>
    `;
    
    return card;
}
