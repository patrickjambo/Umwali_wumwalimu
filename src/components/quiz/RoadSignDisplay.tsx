export default function RoadSignDisplay({ signType, icon }: { signType: string, icon?: string }) {
  // Simple renderer based on the type
  if (signType === 'warning') {
    return (
      <svg width="100" viewBox="0 0 100 100" className="mx-auto block">
        <polygon points="50,10 90,90 10,90" fill="white" stroke="red" strokeWidth="8"/>
        {icon === 'pedestrian' && <circle cx="50" cy="65" r="10" fill="black"/>}
      </svg>
    )
  }
  
  if (signType === 'prohibition') {
    return (
      <svg width="100" viewBox="0 0 100 100" className="mx-auto block">
        <circle cx="50" cy="50" r="40" fill="white" stroke="red" strokeWidth="10"/>
        {icon === 'speed50' && <text x="50" y="65" fontSize="30" textAnchor="middle" fontWeight="bold">50</text>}
      </svg>
    )
  }
  
  return (
    <div className="w-24 h-24 bg-gray-200 border-2 border-gray-400 flex items-center justify-center text-xs text-center p-2 rounded mx-auto">
      Sign: {signType}
    </div>
  )
}
