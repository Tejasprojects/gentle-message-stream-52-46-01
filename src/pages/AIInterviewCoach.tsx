
import React, { useEffect, useRef, useState } from 'react';
import AIInterviewCoachComponent from '@/components/interview/AIInterviewCoachComponent';
import StudentDashboardLayout from '@/components/layout/StudentDashboardLayout';
import { useLocation } from 'react-router-dom';
import { EmotionDetectionSystem } from '../components/interview/EmotionDetectionSystem';
import { EmotionResult, EmotionMetrics } from '../utils/mediapipe/emotionDetection';
import { toast } from '../components/ui/use-toast';
import { Button } from '../components/ui/button';

const AIInterviewCoach: React.FC = () => {
  const location = useLocation();
  const videoRef = useRef<HTMLVideoElement>(null);

  const [currentEmotion, setCurrentEmotion] = useState<EmotionResult | null>(null);
  const [emotionMetrics, setEmotionMetrics] = useState<EmotionMetrics | null>(null);
  const [showEmotionPanel, setShowEmotionPanel] = useState(true);

  useEffect(() => {
    console.log('AIInterviewCoach page mounted, location:', location.pathname);
    
    return () => {
      console.log('AIInterviewCoach page unmounting');
    };
  }, [location.pathname]);

  const handleEmotionChange = (emotion: EmotionResult) => {
    setCurrentEmotion(emotion);
    
    // Provide real-time feedback based on emotions
    if (emotion.emotion === 'anxious' && emotion.intensity === 'high') {
      // Show calming feedback
      toast({
        title: "Stay Calm",
        description: "Take a deep breath. You're doing great!",
        variant: "default"
      });
    } else if (emotion.emotion === 'confident' && emotion.intensity === 'high') {
      // Show positive reinforcement
      toast({
        title: "Excellent!",
        description: "Your confidence is showing through!",
        variant: "default"
      });
    }
  };

  const handleMetricsUpdate = (metrics: EmotionMetrics) => {
    setEmotionMetrics(metrics);
    
    // Provide feedback based on overall metrics
    if (metrics.stressLevel > 0.7) {
      toast({
        title: "Stress Alert",
        description: "Consider taking a moment to relax",
        variant: "destructive"
      });
    }
  };

  return (
    <StudentDashboardLayout>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <AIInterviewCoachComponent />
        </div>
        {showEmotionPanel && (
          <div className="col-span-1">
            <EmotionDetectionSystem
              videoElement={videoRef.current}
              onEmotionChange={handleEmotionChange}
              onMetricsUpdate={handleMetricsUpdate}
            />
          </div>
        )}
      </div>
      <Button
        variant="outline"
        onClick={() => setShowEmotionPanel(!showEmotionPanel)}
        className="mb-4"
      >
        {showEmotionPanel ? 'Hide' : 'Show'} Emotion Detection
      </Button>
    </StudentDashboardLayout>
  );
};

export default AIInterviewCoach;
