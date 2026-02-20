import { useState } from 'react'
import DemoConfig from '../components/demo/DemoConfig'
import DemoLoading from '../components/demo/DemoLoading'
import DemoSimulation from '../components/demo/DemoSimulation'

export default function DemoMigration() {
  const [screen, setScreen] = useState('config') // 'config' | 'loading' | 'simulation'
  const [config, setConfig] = useState(null)

  const handleStart = (cfg) => {
    setConfig(cfg)
    setScreen('loading')
  }

  const handleLoadingComplete = () => {
    setScreen('simulation')
  }

  const handleReset = () => {
    setConfig(null)
    setScreen('config')
  }

  if (screen === 'loading' && config) {
    return (
      <DemoLoading
        origin={config.origin}
        destination={config.destination}
        onComplete={handleLoadingComplete}
      />
    )
  }

  if (screen === 'simulation' && config) {
    return (
      <DemoSimulation
        config={config}
        onReset={handleReset}
      />
    )
  }

  return <DemoConfig onStart={handleStart} />
}
