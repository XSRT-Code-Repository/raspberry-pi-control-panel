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
    document.getElementById('edit-servo-open-angle').value = servo.open_angle;
    document.getElementById('edit-servo-close-angle').value = servo.close_angle;
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
        enabled: document.getElementById('edit-servo-enabled').checked,
        open_angle: parseInt(document.getElementById('edit-servo-open-angle').value),
        close_angle: parseInt(document.getElementById('edit-servo-close-angle').value)
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