import React from 'react'
import ServoCard from './ServoCard'

function ServoControls({ servos, isAnyServoMoving, setIsAnyServoMoving, onServoUpdate, showGlobalStatus }) {
  const enabledServos = Object.values(servos).filter(servo => servo.enabled)

  if (enabledServos.length === 0) {
    return (
      <div className="p-10">
        <div className="text-center py-16 px-5 text-gray-400">
          <h3 className="text-3xl mb-4 text-gray-400">No servos configured</h3>
          <p className="text-xl mb-6">Click the Config button to add servos</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-10 grid grid-cols-[repeat(auto-fit,minmax(350px,1fr))] gap-8 md:p-5 md:grid-cols-1">
      {enabledServos.map(servo => (
        <ServoCard
          key={servo.id}
          servo={servo}
          isAnyServoMoving={isAnyServoMoving}
          setIsAnyServoMoving={setIsAnyServoMoving}
          onUpdate={onServoUpdate}
          showGlobalStatus={showGlobalStatus}
        />
      ))}
    </div>
  )
}

export default ServoControls
