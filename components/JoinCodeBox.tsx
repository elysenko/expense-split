'use client';

import { useState } from 'react';

export default function JoinCodeBox({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="joincode-box">
      <span className="code" data-testid="join-code-value">{code}</span>
      <button className="btn sm" onClick={copy} data-testid="copy-join-code">
        {copied ? 'Copied ✓' : 'Copy'}
      </button>
    </div>
  );
}
