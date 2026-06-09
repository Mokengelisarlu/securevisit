import { View, PanResponder, useWindowDimensions } from 'react-native';
import { forwardRef, useImperativeHandle, useRef, useState, useCallback } from 'react';
import Svg, { Path } from 'react-native-svg';
import { captureRef } from 'react-native-view-shot';

interface Point {
  x: number;
  y: number;
}

interface Stroke {
  points: Point[];
}

export interface SignaturePadHandle {
  clear: () => void;
  capture: () => Promise<string | undefined>;
  isEmpty: boolean;
}

export const SignaturePad = forwardRef<SignaturePadHandle>((_, ref) => {
  const { width } = useWindowDimensions();
  const padWidth = width - 48;
  const svgRef = useRef<any>(null);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentPoints, setCurrentPoints] = useState<Point[]>([]);
  const [isEmpty, setIsEmpty] = useState(true);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        setIsEmpty(false);
        setCurrentPoints([{ x: locationX, y: locationY }]);
      },
      onPanResponderMove: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        setCurrentPoints((prev) => [...prev, { x: locationX, y: locationY }]);
      },
      onPanResponderRelease: () => {
        setCurrentPoints((prev) => {
          if (prev.length > 1) {
            setStrokes((s) => [...s, { points: prev }]);
          }
          return [];
        });
      },
    })
  ).current;

  const clear = useCallback(() => {
    setStrokes([]);
    setCurrentPoints([]);
    setIsEmpty(true);
  }, []);

  const capture = useCallback(async () => {
    if (!svgRef.current) return;
    try {
      const uri = await captureRef(svgRef, { format: 'png', quality: 0.8 });
      return uri;
    } catch {
      return undefined;
    }
  }, []);

  useImperativeHandle(ref, () => ({
    clear,
    capture,
    isEmpty,
  }), [clear, capture, isEmpty]);

  function pathFromPoints(points: Point[]): string | null {
    if (points.length < 2) return null;
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      d += ` L ${points[i].x} ${points[i].y}`;
    }
    return d;
  }

  return (
    <View
      ref={svgRef}
      collapsable={false}
      style={{
        width: '100%',
        height: 200,
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        overflow: 'hidden',
      }}
      {...panResponder.panHandlers}
    >
      <Svg width="100%" height="100%" viewBox={`0 0 ${padWidth} 200`}>
        {strokes.map((stroke, i) => {
          const d = pathFromPoints(stroke.points);
          return d ? (
            <Path
              key={i}
              d={d}
              stroke="#1e293b"
              strokeWidth={3}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : null;
        })}
        {currentPoints.length > 1 && (
          <Path
            d={pathFromPoints(currentPoints)!}
            stroke="#1e293b"
            strokeWidth={3}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
      </Svg>
    </View>
  );
});

// Add displayName for React DevTools and to satisfy lint rules
SignaturePad.displayName = 'SignaturePad';
