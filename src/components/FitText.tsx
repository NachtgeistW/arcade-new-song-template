import React, { useLayoutEffect, useRef, useState } from 'react';
import { continueRender, delayRender } from 'remotion';

interface Props {
  text: string;
  maxSize: number;
  minSize?: number;
  multiline?: boolean;
  style?: React.CSSProperties;
}

export const FitText: React.FC<Props> = ({ text, maxSize, minSize = 12, multiline = false, style }) => {
  const box = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLSpanElement>(null);
  const [handle] = useState(() => delayRender(`fit text: ${text}`));
  const done = useRef(false);

  useLayoutEffect(() => {
    let cancelled = false;
    document.fonts.ready.then(() => {
      const b = box.current;
      const el = inner.current;
      if (cancelled || !b || !el) return;
      let size = maxSize;
      el.style.fontSize = `${size}px`;
      if (multiline) {
        while (size > minSize && (b.scrollHeight > b.clientHeight + 1 || el.scrollWidth > b.clientWidth + 1)) {
          size = Math.max(minSize, size * 0.94);
          el.style.fontSize = `${size}px`;
        }
      } else if (el.scrollWidth > b.clientWidth) {
        size = Math.max(minSize, (maxSize * b.clientWidth) / el.scrollWidth);
        el.style.fontSize = `${size}px`;
        // Letter spacing stays fixed when the font shrinks, so recheck the result.
        while (size > minSize && el.scrollWidth > b.clientWidth + 1) {
          size = Math.max(minSize, size * 0.96);
          el.style.fontSize = `${size}px`;
        }
      }
      if (!done.current) {
        done.current = true;
        continueRender(handle);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [text, maxSize, minSize, multiline, handle]);

  return (
    <div
      ref={box}
      style={{
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        display: 'flex',
        alignItems: multiline ? 'flex-start' : 'center',
        ...style,
      }}
    >
      <span
        ref={inner}
        style={{
          whiteSpace: multiline ? 'pre-wrap' : 'nowrap',
          wordBreak: multiline ? 'break-word' : undefined,
          lineHeight: multiline ? 1.35 : 1.15,
        }}
      >
        {text}
      </span>
    </div>
  );
};
