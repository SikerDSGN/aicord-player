import { useEffect, useRef } from "react";

interface AudioVisualizerProps {
  audioElement: HTMLAudioElement | null;
  isPlaying: boolean;
}

export function AudioVisualizer({ audioElement, isPlaying }: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);

  useEffect(() => {
    if (!audioElement || !canvasRef.current) return;

    // Check if audio context already exists
    const existingContext = (audioElement as any)._audioContext;
    let audioContext: AudioContext;
    let analyser: AnalyserNode;
    let source: MediaElementAudioSourceNode;

    if (existingContext) {
      audioContext = existingContext;
      analyser = (audioElement as any)._analyser;
      source = (audioElement as any)._source;
    } else {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyser = audioContext.createAnalyser();
      source = audioContext.createMediaElementSource(audioElement);
      
      source.connect(analyser);
      analyser.connect(audioContext.destination);

      // Store references to prevent recreating
      (audioElement as any)._audioContext = audioContext;
      (audioElement as any)._analyser = analyser;
      (audioElement as any)._source = source;
    }
    
    analyser.fftSize = 256;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength) as Uint8Array;

    analyserRef.current = analyser;
    dataArrayRef.current = dataArray;

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [audioElement]);

  useEffect(() => {
    if (!isPlaying || !canvasRef.current || !analyserRef.current || !dataArrayRef.current) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const analyser = analyserRef.current;
    const dataArray = dataArrayRef.current;
    const bufferLength = dataArray.length;
    
    let phase = 0;

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);

      // @ts-ignore - TypeScript issue with Uint8Array types
      analyser.getByteFrequencyData(dataArray);

      // Clear with gradient background
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, "rgba(15, 23, 42, 0.3)");
      gradient.addColorStop(1, "rgba(30, 41, 59, 0.3)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw multiple waveform layers
      const layers = 3;
      for (let layer = 0; layer < layers; layer++) {
        ctx.beginPath();
        ctx.lineWidth = 3 - layer * 0.5;
        
        const hue = (phase + layer * 60) % 360;
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
        gradient.addColorStop(0, `hsla(${hue}, 80%, 60%, ${0.8 - layer * 0.2})`);
        gradient.addColorStop(0.5, `hsla(${(hue + 60) % 360}, 80%, 60%, ${0.8 - layer * 0.2})`);
        gradient.addColorStop(1, `hsla(${(hue + 120) % 360}, 80%, 60%, ${0.8 - layer * 0.2})`);
        ctx.strokeStyle = gradient;
        ctx.shadowBlur = 20 - layer * 5;
        ctx.shadowColor = `hsla(${hue}, 80%, 60%, 0.5)`;

        const sliceWidth = canvas.width / bufferLength;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const v = dataArray[i] / 255.0;
          const y = (canvas.height / 2) + 
                    Math.sin(i * 0.05 + phase + layer * 0.5) * 30 * v + 
                    (v - 0.5) * canvas.height * 0.4 * (1 - layer * 0.2);

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }

          x += sliceWidth;
        }

        ctx.stroke();
      }

      // Reset shadow
      ctx.shadowBlur = 0;
      
      // Animate phase for flowing effect
      phase += 0.03;
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying]);

  return (
    <div className="relative w-full h-32 rounded-lg overflow-hidden bg-gradient-to-br from-background/50 to-muted/50 backdrop-blur-sm border border-border/50">
      <canvas
        ref={canvasRef}
        width={800}
        height={128}
        className="w-full h-full"
      />
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">Audio vizualizér - zahraj skladbu</p>
        </div>
      )}
    </div>
  );
}
