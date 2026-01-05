import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

type TimerMode = 'focus' | 'break';
type TimerState = 'idle' | 'running' | 'paused';

export default function TimerScreen() {
  const { colors } = useTheme();
  const [mode, setMode] = useState<TimerMode>('focus');
  const [state, setState] = useState<TimerState>('idle');
  const [seconds, setSeconds] = useState(0);
  const [todayMinutes, setTodayMinutes] = useState(68);
  const [modeAnimation] = useState(new Animated.Value(0));

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (state === 'running') {
      interval = setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [state]);

  useEffect(() => {
    Animated.spring(modeAnimation, {
      toValue: mode === 'focus' ? 0 : 1,
      useNativeDriver: false,
      tension: 100,
      friction: 10,
    }).start();
  }, [mode]);

  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handlePrimaryAction = () => {
    if (state === 'idle') {
      setState('running');
    } else if (state === 'running') {
      setState('paused');
    } else if (state === 'paused') {
      setState('running');
    }
  };

  const handleStop = () => {
    if (seconds > 0) {
      setTodayMinutes((prev) => prev + Math.floor(seconds / 60));
    }
    setState('idle');
    setSeconds(0);
  };

  const dailyGoal = 120;
  const progress = Math.min((todayMinutes / dailyGoal) * 100, 100);

  const getButtonText = () => {
    if (state === 'idle') return 'Start';
    if (state === 'running') return 'Pause';
    return 'Resume';
  };

  const getButtonColor = () => {
    if (state === 'idle') return colors.accent;
    if (state === 'running') return '#ff9500';
    return '#34c759';
  };

  const getButtonIcon = () => {
    if (state === 'running') return 'pause';
    return 'play';
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        {/* Mode Selector */}
        <View style={[styles.modeSelector, { backgroundColor: colors.card }]}>
          <Animated.View
            style={[
              styles.modeSelectorIndicator,
              { backgroundColor: colors.background },
              {
                left: modeAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['2%', '50%'],
                }),
                right: modeAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['50%', '2%'],
                }),
              },
            ]}
          />
          <TouchableOpacity
            style={styles.modeButton}
            onPress={() => setMode('focus')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.modeText,
                { color: mode === 'focus' ? colors.text : colors.textSecondary },
              ]}
            >
              Focus
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.modeButton}
            onPress={() => setMode('break')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.modeText,
                { color: mode === 'break' ? colors.text : colors.textSecondary },
              ]}
            >
              Break
            </Text>
          </TouchableOpacity>
        </View>

        {/* Timer Display */}
        <View style={styles.timerContainer}>
          <Text style={[styles.timerText, { color: colors.text }]}>
            {formatTime(seconds)}
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: getButtonColor() }]}
            onPress={handlePrimaryAction}
            activeOpacity={0.8}
          >
            <Ionicons name={getButtonIcon()} size={24} color="white" />
            <Text style={styles.primaryButtonText}>{getButtonText()}</Text>
          </TouchableOpacity>
          {state !== 'idle' && (
            <TouchableOpacity
              style={[styles.stopButton, { backgroundColor: colors.destructive }]}
              onPress={handleStop}
              activeOpacity={0.8}
            >
              <Ionicons name="stop" size={24} color="white" />
            </TouchableOpacity>
          )}
        </View>

        {/* Progress */}
        <View style={styles.progressContainer}>
          <View style={styles.progressHeader}>
            <Text style={[styles.progressText, { color: colors.textSecondary }]}>
              {todayMinutes} min studied today
            </Text>
            <Text style={[styles.progressText, { color: colors.textSecondary }]}>
              Goal: {dailyGoal} min
            </Text>
          </View>
          <View style={[styles.progressBar, { backgroundColor: colors.card }]}>
            <View
              style={[
                styles.progressFill,
                { width: `${progress}%`, backgroundColor: colors.accent },
              ]}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    alignItems: 'center',
  },
  modeSelector: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 25,
    padding: 4,
    flexDirection: 'row',
    position: 'relative',
  },
  modeSelectorIndicator: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    borderRadius: 21,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  modeText: {
    fontSize: 16,
    fontWeight: '600',
  },
  timerContainer: {
    marginTop: 80,
    marginBottom: 80,
  },
  timerText: {
    fontSize: 72,
    fontWeight: '200',
    letterSpacing: -2,
    fontVariant: ['tabular-nums'],
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 16,
    width: '100%',
    maxWidth: 400,
    marginBottom: 40,
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  stopButton: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  progressContainer: {
    width: '100%',
    maxWidth: 400,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  progressText: {
    fontSize: 13,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
});
