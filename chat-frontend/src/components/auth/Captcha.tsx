import { useState, useEffect, useCallback, useRef } from 'react';
import { cn } from '../../utils/cn';

const CAPTCHA_LENGTH = 6;
const CAPTCHA_EXPIRY_MS = 4 * 60 * 1000;

function generateCaptcha(): string {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghjkmnpqrstuvwxyz';
  const digits = '23456789';
  const all = upper + lower + digits;
  let result = '';
  result += upper[Math.floor(Math.random() * upper.length)];
  result += lower[Math.floor(Math.random() * lower.length)];
  result += digits[Math.floor(Math.random() * digits.length)];
  for (let i = 3; i < CAPTCHA_LENGTH; i++) {
    result += all[Math.floor(Math.random() * all.length)];
  }
  return result.split('').sort(() => Math.random() - 0.5).join('');
}

function captchaColor(index: number): string {
  const colors = ['#d44c4c', '#4c8ad4', '#4cd47c', '#d4a64c', '#8a4cd4', '#d44c8a'];
  return colors[index % colors.length];
}

interface CaptchaProps {
  onValidate: (valid: boolean) => void;
  disabled?: boolean;
}

export function Captcha({ onValidate, disabled }: CaptchaProps) {
  const [code, setCode] = useState(generateCaptcha);
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);
  const [expired, setExpired] = useState(false);
  const expiryRef = useRef<number>(Date.now() + CAPTCHA_EXPIRY_MS);
  const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const onValidateRef = useRef(onValidate);
  onValidateRef.current = onValidate;

  useEffect(() => {
    expiryRef.current = Date.now() + CAPTCHA_EXPIRY_MS;
    timerRef.current = setInterval(() => {
      if (Date.now() > expiryRef.current) {
        setExpired(true);
        setCode(generateCaptcha());
        expiryRef.current = Date.now() + CAPTCHA_EXPIRY_MS;
        setInput('');
        setError(false);
        onValidateRef.current(false);
      }
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  const handleChange = useCallback((val: string) => {
    setInput(val);
    setError(false);
    if (val.length >= CAPTCHA_LENGTH) {
      const valid = val.toUpperCase() === code.toUpperCase();
      setError(!valid);
      onValidateRef.current(valid);
      if (valid) setInput(val);
    } else {
      onValidateRef.current(false);
    }
  }, [code]);

  const refresh = () => {
    setCode(generateCaptcha());
    expiryRef.current = Date.now() + CAPTCHA_EXPIRY_MS;
    setExpired(false);
    setInput('');
    setError(false);
    onValidateRef.current(false);
  };

  const remaining = Math.max(0, Math.floor((expiryRef.current - Date.now()) / 1000));
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 select-none">
          {code.split('').map((ch, i) => (
            <span
              key={`${i}-${ch}`}
              style={{ color: captchaColor(i), transform: `rotate(${(i - 2) * 3}deg)` }}
              className="inline-block text-lg font-bold font-mono tracking-widest"
            >
              {ch}
            </span>
          ))}
        </div>
        <button type="button" onClick={refresh} disabled={disabled} className="p-1.5 rounded-md text-text-tertiary hover:text-text hover:bg-black/5 dark:hover:bg-white/5 transition-all text-xs" title="Refresh code">
          ↻
        </button>
        <span className="text-[10px] text-text-tertiary font-mono">{String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}</span>
      </div>
      <div className="relative">
        <input
          type="text"
          value={input}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Enter the code above"
          maxLength={CAPTCHA_LENGTH}
          disabled={disabled}
          className={cn('w-full h-10 px-3 text-sm rounded-xl border bg-surface-secondary text-text placeholder-text-tertiary focus:outline-none focus:ring-2 transition-all', error ? 'border-accent-rose focus:ring-accent-rose/30' : expired ? 'border-amber-400 focus:ring-amber-400/30' : 'border-border focus:ring-primary-500/30 focus:border-primary-500')}
        />
        {error && <p className="text-[10px] text-accent-rose mt-0.5">Code does not match. Try again.</p>}
        {expired && <p className="text-[10px] text-amber-500 mt-0.5">Code expired. New one generated.</p>}
      </div>
    </div>
  );
}
