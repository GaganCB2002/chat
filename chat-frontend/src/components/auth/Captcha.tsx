import { useState, useEffect, useCallback, useRef } from 'react';
import { cn } from '../../utils/cn';

const CAPTCHA_LENGTH = 8;
const CAPTCHA_EXPIRY_MS = 4 * 60 * 1000;

function generateCaptcha(): string {
  const digits = '0123456789';
  let result = '';
  for (let i = 0; i < CAPTCHA_LENGTH; i++) {
    result += digits[Math.floor(Math.random() * digits.length)];
  }
  return result;
}

interface CaptchaProps {
  onValidate: (valid: boolean) => void;
  disabled?: boolean;
  key?: string | number;
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
    if (!/^\d*$/.test(val)) return;
    setInput(val);
    setError(false);
    if (val.length >= CAPTCHA_LENGTH) {
      const valid = val === code;
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
        <div className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 select-none">
          {code.split('').map((ch, i) => (
            <span
              key={`${i}-${ch}`}
              className="inline-block text-xl font-bold font-mono tracking-widest text-gray-700 dark:text-gray-200"
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
          inputMode="numeric"
          value={input}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Enter 8-digit code"
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
