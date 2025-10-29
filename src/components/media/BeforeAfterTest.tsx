import React from 'react'

import { BeforeAfterSlider } from './BeforeAfterSlider'

// Simple test component to verify basic functionality
export const BeforeAfterTest: React.FC = () => {
  const testImage = {
    id: 'test-1',
    beforeImage: 'https://images.unsplash.com/photo-1596461402266-10c7766c5ba7?w=800&q=80',
    afterImage: 'https://images.unsplash.com/photo-1596461402266-10c7766c5ba7?w=800&q=80',
    title: 'Test Transformation',
    description: 'Basic functionality test'
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Before/After Test</h1>
      <div className="max-w-2xl">
        <BeforeAfterSlider
          images={testImage}
          showControls={true}
          showLabels={true}
        />
      </div>
    </div>
  )
}