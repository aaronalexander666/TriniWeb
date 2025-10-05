// Add these functions to your React component
const [audioState, setAudioState] = useState({
  isPlaying: false,
  volume: 0.7,
  isMuted: false,
  currentTime: 0,
  duration: 180
});

// Fetch initial state
useEffect(() => {
  fetch('/api/state')
    .then(res => res.json())
    .then(data => setAudioState(data));
}, []);

// Update your control functions
const togglePlay = async () => {
  const response = await fetch('/api/control', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'togglePlay' })
  });
  const newState = await response.json();
  setAudioState(newState);
};

const setVolume = async (volume) => {
  const response = await fetch('/api/control', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'setVolume', value: volume })
  });
  const newState = await response.json();
  setAudioState(newState);
};

// Add WebSocket connection for real-time updates
useEffect(() => {
  const ws = new WebSocket(`ws://localhost:8080/ws`);
  
  ws.onmessage = (event) => {
    const state = JSON.parse(event.data);
    setAudioState(state);
  };
  
  return () => ws.close();
}, []);