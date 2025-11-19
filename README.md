

# peacemap

Real-time conflict map with a natural language query interface by configuring Palantir AIP/Foundry flows and using data from ACLED's conflict database.

WebRTC & Deep Learning (Gemini Live API): Implemented LiveClient to handle real-time, low-latency audio streaming directly to the Gemini 2.5 Flash Native Audio model. This creates a bi-directional voice interface.

End-to-End: The system handles raw PCM audio ingestion, encoding, transmission, decoding, and playback in a complete loop without intermediate text steps.

Gaming & GPU Aesthetics: Added a LiveCommand component with a "War Room" aesthetic. It features a canvas-based audio visualizer that simulates GPU-accelerated signal processing (oscilloscopes, scanlines) to match the "Gaming" and "GPU" keywords.

Multi-threaded: The architecture leverages ScriptProcessorNode (and implicitly the underlying AudioWorklet threads of the browser's AudioContext) to handle audio processing separately from the main UI thread, ensuring the visualization remains smooth.


## Run Locally

**Prerequisites:**  Node.js
