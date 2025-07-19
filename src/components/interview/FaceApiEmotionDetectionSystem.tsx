import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Alert, AlertDescription } from '../ui/alert';
import { Button } from '../ui/button';
import { Loader2, RefreshCw, Video, VideoOff, Camera, Eye, Smile, Brain } from 'lucide-react';
import { 
  faceApiEmotionDetectionSystem, 
  FaceApiEmotionResult, 
  FaceApiMetrics 
} from '../../utils/face-api-integration';

interface FaceApiEmotionDetectionSystemProps {
  videoElement: HTMLVideoElement | null;
  onEmotionChange?: (emotion: FaceApiEmotionResult) => void;
  onMetricsUpdate?: (metrics: FaceApiMetrics) => void;
}

export const FaceApiEmotionDetectionSystem: React.FC<FaceApiEmotionDetectionSystemProps> = ({
  videoElement,
  onEmotionChange,
  onMetricsUpdate
}) => {
  const [currentEmotion, setCurrentEmotion] = useState<FaceApiEmotionResult | null>(null);
  const [metrics, setMetrics] = useState<FaceApiMetrics | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoStatus, setVideoStatus] = useState<string>('Checking video...');
  const [detectionCount, setDetectionCount] = useState(0);
  const [faceDetectionCount, setFaceDetectionCount] = useState(0);
  const [lastDetectionTime, setLastDetectionTime] = useState<Date | null>(null);
  const [faceDetected, setFaceDetected] = useState(false);
  const [detectionDetails, setDetectionDetails] = useState<any>(null);
  const detectionInterval = useRef<NodeJS.Timeout | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const initializeFaceApi = async () => {
    setIsInitializing(true);
    setError(null);
    
    try {
      await faceApiEmotionDetectionSystem.initialize();
      setIsInitialized(true);
      setError(null);
      console.log('Face-API.js initialized successfully');
    } catch (err) {
      console.error('Initialization error:', err);
      setError('Failed to initialize Face-API.js emotion detection system. Please check if the model files are accessible.');
    } finally {
      setIsInitializing(false);
    }
  };

  const startEmotionDetection = () => {
    if (detectionInterval.current) {
      clearInterval(detectionInterval.current);
    }

    detectionInterval.current = setInterval(async () => {
      try {
        if (videoElement && isInitialized && faceApiEmotionDetectionSystem.isReady()) {
          // Check video status
          if (videoElement.videoWidth === 0 || videoElement.videoHeight === 0) {
            setVideoStatus('Video not ready - waiting for stream...');
            return;
          }

          if (!videoElement.srcObject) {
            setVideoStatus('No camera stream detected');
            return;
          }

          setVideoStatus(`Video active: ${videoElement.videoWidth}x${videoElement.videoHeight}`);

          const emotion = await faceApiEmotionDetectionSystem.detectEmotion(videoElement);
          if (emotion) {
            setCurrentEmotion(emotion);
            setDetectionCount(faceApiEmotionDetectionSystem.getDetectionCount());
            setFaceDetectionCount(faceApiEmotionDetectionSystem.getFaceDetectionCount());
            setLastDetectionTime(new Date());
            setFaceDetected(emotion.faceDetected);
            onEmotionChange?.(emotion);

            // Get detection details for visualization
            setDetectionDetails({
              faceBox: emotion.faceBox,
              expressions: emotion.expressions,
              totalDetections: faceApiEmotionDetectionSystem.getTotalDetectionCount()
            });

            // Update metrics every 2 seconds
            const metrics = faceApiEmotionDetectionSystem.getEmotionMetrics();
            setMetrics(metrics);
            onMetricsUpdate?.(metrics);
          } else {
            setVideoStatus('No emotion detected - check camera positioning');
            setFaceDetected(false);
          }
        } else {
          if (!videoElement) {
            setVideoStatus('Waiting for video element...');
          } else if (!isInitialized) {
            setVideoStatus('Initializing Face-API.js...');
          } else {
            setVideoStatus('System not ready');
          }
        }
      } catch (err) {
        console.error('Emotion detection error:', err);
        setVideoStatus('Detection error occurred');
      }
    }, 1000); // Detect every 1 second
  };

  useEffect(() => {
    let mounted = true;
    
    const init = async () => {
      if (mounted) {
        await initializeFaceApi();
      }
    };
    
    init();
    
    return () => {
      mounted = false;
      if (detectionInterval.current) {
        clearInterval(detectionInterval.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isInitialized && videoElement) {
      console.log('FaceApiEmotionDetectionSystem: Starting detection with video element:', videoElement);
      console.log('Video element properties:', {
        videoWidth: videoElement.videoWidth,
        videoHeight: videoElement.videoHeight,
        srcObject: videoElement.srcObject,
        readyState: videoElement.readyState
      });
      startEmotionDetection();
    } else {
      console.log('FaceApiEmotionDetectionSystem: Not ready for detection:', {
        isInitialized,
        hasVideoElement: !!videoElement,
        videoElement: videoElement
      });
    }
  }, [isInitialized, videoElement]);

  const getEmotionColor = (emotion: string) => {
    const colors: Record<string, string> = {
      happy: 'bg-green-500',
      sad: 'bg-blue-500',
      angry: 'bg-red-500',
      fearful: 'bg-purple-500',
      surprised: 'bg-yellow-500',
      disgusted: 'bg-orange-500',
      neutral: 'bg-gray-500'
    };
    return colors[emotion] || 'bg-gray-500';
  };

  const getIntensityColor = (intensity: string) => {
    switch (intensity) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString();
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  // Show error state
  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Alert variant="destructive">
            <AlertDescription className="flex items-center justify-between">
              <span>{error}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={initializeFaceApi}
                disabled={isInitializing}
              >
                {isInitializing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Show loading state
  if (isInitializing) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center space-x-2 py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading Face-API.js models...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Camera Feed Display */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Live Camera Feed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative aspect-video rounded-lg overflow-hidden bg-slate-100">
            {videoElement ? (
              <>
                <video
                  ref={(el) => {
                    if (el && videoElement) {
                      el.srcObject = videoElement.srcObject;
                      el.style.width = '100%';
                      el.style.height = '100%';
                      el.style.objectFit = 'cover';
                    }
                  }}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <canvas
                  ref={canvasRef}
                  className="absolute top-0 left-0 w-full h-full pointer-events-none"
                  style={{ opacity: 0.8 }}
                />
                {/* Face Detection Overlay */}
                {faceDetected && (
                  <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded text-xs font-semibold flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    Face Detected
                  </div>
                )}
                {!faceDetected && (
                  <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-semibold flex items-center gap-1">
                    <VideoOff className="h-3 w-3" />
                    No Face
                  </div>
                )}
                {/* Detection Details */}
                {detectionDetails && detectionDetails.expressions && (
                  <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                    <div>Total: {detectionDetails.totalDetections}</div>
                    <div>Faces: {faceDetectionCount}</div>
                    <div>Rate: {formatPercentage(faceDetectionCount / Math.max(detectionDetails.totalDetections, 1))}</div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <Camera className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                  <p>Camera not available</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Video Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            Detection Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">{videoStatus}</span>
              <Badge variant="outline">
                {detectionCount} detections
              </Badge>
            </div>
            {lastDetectionTime && (
              <div className="text-xs text-gray-500">
                Last detection: {formatTime(lastDetectionTime)}
              </div>
            )}
            {videoElement && (
              <div className="text-xs text-gray-500">
                Video element: {videoElement.videoWidth}x{videoElement.videoHeight}
              </div>
            )}
            <div className="flex items-center gap-2 mt-2">
              <div className={`w-3 h-3 rounded-full ${faceDetected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm">
                {faceDetected ? 'Face detected' : 'No face detected'}
              </span>
            </div>
            <div className="text-xs text-gray-500">
              Face detection rate: {formatPercentage(faceDetectionCount / Math.max(detectionCount, 1))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Emotion Display */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smile className="h-5 w-5" />
            Current Emotion
            {isInitialized && (
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Active
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {currentEmotion ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Badge 
                  className={`${getEmotionColor(currentEmotion.emotion)} text-white`}
                >
                  {currentEmotion.emotion.charAt(0).toUpperCase() + 
                   currentEmotion.emotion.slice(1)}
                </Badge>
                <span className={`font-semibold ${getIntensityColor(currentEmotion.intensity)}`}>
                  {currentEmotion.intensity.toUpperCase()} INTENSITY
                </span>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Confidence</span>
                  <span>{formatPercentage(currentEmotion.confidence)}</span>
                </div>
                <Progress value={currentEmotion.confidence * 100} />
              </div>

              <div className="text-sm text-gray-600">
                Expression: {currentEmotion.facialExpression}
              </div>

              {/* Expression Breakdown */}
              {currentEmotion.expressions && (
                <div className="space-y-1">
                  <div className="text-xs font-medium text-gray-500">Expression Breakdown:</div>
                  {Object.entries(currentEmotion.expressions).map(([expression, confidence]) => (
                    <div key={expression} className="flex justify-between text-xs">
                      <span className="capitalize">{expression}</span>
                      <span>{formatPercentage(confidence)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-4">
              <VideoOff className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p>Waiting for emotion detection...</p>
              <p className="text-xs mt-1">Make sure your face is visible in the camera</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Emotion Metrics */}
      {metrics && metrics.emotionHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Emotion Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="text-sm font-medium">Dominant Emotion</div>
                <Badge className={getEmotionColor(metrics.dominantEmotion)}>
                  {metrics.dominantEmotion}
                </Badge>
              </div>
              
              <div className="space-y-2">
                <div className="text-sm font-medium">Average Confidence</div>
                <div className="text-lg font-semibold">
                  {formatPercentage(metrics.averageConfidence)}
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">Emotion Stability</div>
                <Progress value={metrics.emotionStability * 100} />
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">Stress Level</div>
                <Progress 
                  value={metrics.stressLevel * 100} 
                  className="[&>div]:bg-red-500"
                />
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">Engagement Level</div>
                <Progress 
                  value={metrics.engagementLevel * 100} 
                  className="[&>div]:bg-green-500"
                />
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">Face Detection Rate</div>
                <div className="text-lg font-semibold">
                  {formatPercentage(metrics.faceDetectionRate)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Emotion History Chart */}
      {metrics && metrics.emotionHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Emotion Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-1 h-8">
              {metrics.emotionHistory.slice(-20).map((emotion, index) => (
                <div
                  key={index}
                  className={`flex-1 rounded-sm ${getEmotionColor(emotion.emotion)}`}
                  style={{ opacity: emotion.confidence }}
                  title={`${emotion.emotion} (${formatPercentage(emotion.confidence)})`}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}; 