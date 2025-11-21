import React, { useState, useEffect } from 'react'
import { addServo, removeServo, updateServo } from '../services/api'

function ConfigPanel({ visible, servos, onServoUpdate, showGlobalStatus }) {
  const [formData, setFormData] = useState({
    name: '',
    channel: 0,
    min_angle: 0,
    max_angle: 180,
    min_pulse_us: 500,
    max_pulse_us: 2500,
    default_angle: 90,
    enabled: true
  })

  const [editingServo, setEditingServo] = useState(null)
  const [showEditModal, setShowEditModal] = useState(false)

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleAddServo = async (e) => {
    e.preventDefault()

    const servoId = `servo_${formData.channel}`
    
    try {
      const data = await addServo(servoId, {
        name: formData.name,
        channel: parseInt(formData.channel),
        min_angle: parseInt(formData.min_angle),
        max_angle: parseInt(formData.max_angle),
        min_pulse_us: parseInt(formData.min_pulse_us),
        max_pulse_us: parseInt(formData.max_pulse_us),
        default_angle: parseInt(formData.default_angle),
        enabled: formData.enabled
      })

      if (data.success) {
        showGlobalStatus('Servo added successfully', 'success')
        onServoUpdate()
        // Reset form
        setFormData({
          name: '',
          channel: 0,
          min_angle: 0,
          max_angle: 180,
          min_pulse_us: 500,
          max_pulse_us: 2500,
          default_angle: 90,
          enabled: true
        })
      } else {
        showGlobalStatus('Failed to add servo: ' + data.message, 'error')
      }
    } catch (error) {
      showGlobalStatus('Add servo error', 'error')
    }
  }

  const handleDeleteServo = async (servoId) => {
    if (!confirm('Are you sure you want to delete this servo?')) return

    try {
      const data = await removeServo(servoId)
      if (data.success) {
        showGlobalStatus('Servo deleted', 'success')
        onServoUpdate()
      } else {
        showGlobalStatus('Failed to delete servo', 'error')
      }
    } catch (error) {
      showGlobalStatus('Delete error', 'error')
    }
  }

  const openEditModal = (servo) => {
    setEditingServo(servo)
    setShowEditModal(true)
  }

  const closeEditModal = () => {
    setShowEditModal(false)
    setEditingServo(null)
  }

  const handleSaveEdit = async (e) => {
    e.preventDefault()

    try {
      const data = await updateServo(editingServo.id, {
        name: editingServo.name,
        channel: parseInt(editingServo.channel),
        min_angle: parseInt(editingServo.min_angle),
        max_angle: parseInt(editingServo.max_angle),
        min_pulse_us: parseInt(editingServo.min_pulse_us),
        max_pulse_us: parseInt(editingServo.max_pulse_us),
        default_angle: parseInt(editingServo.default_angle),
        enabled: editingServo.enabled,
        open_angle: parseInt(editingServo.open_angle || 0),
        close_angle: parseInt(editingServo.close_angle || 180)
      })

      if (data.success) {
        showGlobalStatus('Servo updated successfully', 'success')
        closeEditModal()
        onServoUpdate()
      } else {
        showGlobalStatus('Failed to update servo: ' + data.message, 'error')
      }
    } catch (error) {
      showGlobalStatus('Update servo error', 'error')
    }
  }

  if (!visible) return null

  return (
    <>
      <div className="bg-gray-50 px-10 py-8 border-t-4 border-blue-500 md:px-5">
        <h2 className="text-slate-700 mb-6 text-3xl">Servo Configuration</h2>

        <div className="bg-white p-6 rounded-xl mb-6 shadow-md">
          <h3 className="text-slate-600 mb-5 text-xl">Add New Servo</h3>
          <form onSubmit={handleAddServo} className="flex flex-col gap-4">
            <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
              <div className="flex flex-col">
                <label htmlFor="name" className="mb-1 font-semibold text-slate-600">Name:</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Servo Name"
                  className="p-2.5 border-2 border-gray-200 rounded text-sm transition-colors focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
              <div className="flex flex-col">
                <label htmlFor="channel" className="mb-1 font-semibold text-slate-600">Channel (0-15):</label>
                <input
                  type="number"
                  id="channel"
                  name="channel"
                  value={formData.channel}
                  onChange={handleInputChange}
                  min="0"
                  max="15"
                  className="p-2.5 border-2 border-gray-200 rounded text-sm transition-colors focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
              <div className="flex flex-col">
                <label htmlFor="min_angle" className="mb-1 font-semibold text-slate-600">Min Angle:</label>
                <input
                  type="number"
                  id="min_angle"
                  name="min_angle"
                  value={formData.min_angle}
                  onChange={handleInputChange}
                  min="0"
                  max="180"
                  className="p-2.5 border-2 border-gray-200 rounded text-sm transition-colors focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="flex flex-col">
                <label htmlFor="max_angle" className="mb-1 font-semibold text-slate-600">Max Angle:</label>
                <input
                  type="number"
                  id="max_angle"
                  name="max_angle"
                  value={formData.max_angle}
                  onChange={handleInputChange}
                  min="0"
                  max="180"
                  className="p-2.5 border-2 border-gray-200 rounded text-sm transition-colors focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
              <div className="flex flex-col">
                <label htmlFor="min_pulse_us" className="mb-1 font-semibold text-slate-600">Min Pulse (μs):</label>
                <input
                  type="number"
                  id="min_pulse_us"
                  name="min_pulse_us"
                  value={formData.min_pulse_us}
                  onChange={handleInputChange}
                  min="100"
                  max="3000"
                  className="p-2.5 border-2 border-gray-200 rounded text-sm transition-colors focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="flex flex-col">
                <label htmlFor="max_pulse_us" className="mb-1 font-semibold text-slate-600">Max Pulse (μs):</label>
                <input
                  type="number"
                  id="max_pulse_us"
                  name="max_pulse_us"
                  value={formData.max_pulse_us}
                  onChange={handleInputChange}
                  min="100"
                  max="3000"
                  className="p-2.5 border-2 border-gray-200 rounded text-sm transition-colors focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
              <div className="flex flex-col">
                <label htmlFor="default_angle" className="mb-1 font-semibold text-slate-600">Default Angle:</label>
                <input
                  type="number"
                  id="default_angle"
                  name="default_angle"
                  value={formData.default_angle}
                  onChange={handleInputChange}
                  min="0"
                  max="180"
                  className="p-2.5 border-2 border-gray-200 rounded text-sm transition-colors focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="flex flex-col">
                <label className="flex items-center cursor-pointer mt-7">
                  <input
                    type="checkbox"
                    id="enabled"
                    name="enabled"
                    checked={formData.enabled}
                    onChange={handleInputChange}
                    className="mr-2 w-5 h-5 cursor-pointer"
                  />
                  Enable Servo
                </label>
              </div>
            </div>

            <button type="submit" className="px-6 py-3 bg-gradient-to-br from-emerald-500 to-emerald-600 border-none text-white rounded-lg cursor-pointer font-semibold text-base transition-all duration-300 shadow-md mt-2.5 hover:from-emerald-600 hover:to-emerald-700 hover:-translate-y-0.5 hover:shadow-lg">
              ➕ Add Servo
            </button>
          </form>
        </div>

        <div className="bg-white p-6 rounded-xl mb-6 shadow-md">
          <h3 className="text-slate-600 mb-5 text-xl">Configured Servos</h3>
          <div className="flex flex-col gap-2.5">
            {Object.values(servos).map(servo => (
              <div key={servo.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border-l-4 border-blue-500 md:flex-col md:gap-4 md:items-start">
                <div className="flex flex-col gap-1">
                  <strong className="text-lg text-slate-700">{servo.name}</strong>
                  <span className="text-sm text-gray-500">Channel {servo.channel}</span>
                  <span className={servo.enabled ? 'text-green-600' : 'text-orange-600'}>
                    {servo.enabled ? '✅ Enabled' : '⚠️ Disabled'}
                  </span>
                </div>
                <div className="flex gap-2.5 md:w-full md:justify-between">
                  <button
                    onClick={() => openEditModal(servo)}
                    className="px-4 py-2 border-none rounded font-semibold transition-all duration-300 bg-gradient-to-br from-blue-500 to-blue-700 text-white hover:-translate-y-0.5 hover:shadow-md"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => handleDeleteServo(servo.id)}
                    className="px-4 py-2 border-none rounded font-semibold transition-all duration-300 bg-gradient-to-br from-red-500 to-red-700 text-white hover:-translate-y-0.5 hover:shadow-md"
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && editingServo && (
        <div className="fixed top-0 left-0 w-full h-full bg-black/60 flex justify-center items-center z-[1000]">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-[90%] max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-5 pb-4 border-b-2 border-gray-100">
              <h2 className="text-slate-700 text-2xl">Edit Servo: {editingServo.name}</h2>
              <button onClick={closeEditModal} className="bg-transparent border-none text-5xl text-gray-400 cursor-pointer p-0 w-10 h-10 flex items-center justify-center transition-colors hover:text-red-500">×</button>
            </div>
            <form onSubmit={handleSaveEdit} className="flex flex-col gap-4">
              <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4 md:grid-cols-1">
                <div className="flex flex-col">
                  <label className="mb-1 font-semibold text-slate-600">Name:</label>
                  <input
                    type="text"
                    value={editingServo.name}
                    onChange={(e) => setEditingServo({...editingServo, name: e.target.value})}
                    className="p-2.5 border-2 border-gray-200 rounded text-sm transition-colors focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
                <div className="flex flex-col">
                  <label className="mb-1 font-semibold text-slate-600">Channel:</label>
                  <input
                    type="number"
                    value={editingServo.channel}
                    onChange={(e) => setEditingServo({...editingServo, channel: e.target.value})}
                    min="0"
                    max="15"
                    className="p-2.5 border-2 border-gray-200 rounded text-sm transition-colors focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4 md:grid-cols-1">
                <div className="flex flex-col">
                  <label className="mb-1 font-semibold text-slate-600">Min Angle:</label>
                  <input
                    type="number"
                    value={editingServo.min_angle}
                    onChange={(e) => setEditingServo({...editingServo, min_angle: e.target.value})}
                    min="0"
                    max="180"
                    className="p-2.5 border-2 border-gray-200 rounded text-sm transition-colors focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="mb-1 font-semibold text-slate-600">Max Angle:</label>
                  <input
                    type="number"
                    value={editingServo.max_angle}
                    onChange={(e) => setEditingServo({...editingServo, max_angle: e.target.value})}
                    min="0"
                    max="180"
                    className="p-2.5 border-2 border-gray-200 rounded text-sm transition-colors focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4 md:grid-cols-1">
                <div className="flex flex-col">
                  <label className="mb-1 font-semibold text-slate-600">Min Pulse (μs):</label>
                  <input
                    type="number"
                    value={editingServo.min_pulse_us}
                    onChange={(e) => setEditingServo({...editingServo, min_pulse_us: e.target.value})}
                    min="100"
                    max="3000"
                    className="p-2.5 border-2 border-gray-200 rounded text-sm transition-colors focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="mb-1 font-semibold text-slate-600">Max Pulse (μs):</label>
                  <input
                    type="number"
                    value={editingServo.max_pulse_us}
                    onChange={(e) => setEditingServo({...editingServo, max_pulse_us: e.target.value})}
                    min="100"
                    max="3000"
                    className="p-2.5 border-2 border-gray-200 rounded text-sm transition-colors focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4 md:grid-cols-1">
                <div className="flex flex-col">
                  <label className="mb-1 font-semibold text-slate-600">Default Angle:</label>
                  <input
                    type="number"
                    value={editingServo.default_angle}
                    onChange={(e) => setEditingServo({...editingServo, default_angle: e.target.value})}
                    min="0"
                    max="180"
                    className="p-2.5 border-2 border-gray-200 rounded text-sm transition-colors focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="flex items-center cursor-pointer mt-7">
                    <input
                      type="checkbox"
                      checked={editingServo.enabled}
                      onChange={(e) => setEditingServo({...editingServo, enabled: e.target.checked})}
                      className="mr-2 w-5 h-5 cursor-pointer"
                    />
                    Enable Servo
                  </label>
                </div>
              </div>

              <div className="flex gap-2.5 justify-end mt-5">
                <button type="button" onClick={closeEditModal} className="px-6 py-3 bg-gray-400 border-none text-white rounded-lg cursor-pointer font-semibold transition-all duration-300 hover:bg-gray-500 hover:-translate-y-0.5">
                  Cancel
                </button>
                <button type="submit" className="px-6 py-3 bg-gradient-to-br from-emerald-500 to-emerald-600 border-none text-white rounded-lg cursor-pointer font-semibold transition-all duration-300 shadow-md hover:from-emerald-600 hover:to-emerald-700 hover:-translate-y-0.5 hover:shadow-lg">
                  💾 Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

export default ConfigPanel
