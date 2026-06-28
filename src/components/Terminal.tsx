import React, { useEffect, useRef } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';

export function TerminalPane() {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);

  useEffect(() => {
    if (!terminalRef.current) return;

    // Initialize xterm.js
    const term = new XTerm({
      theme: {
        background: '#09090b', // match var(--color-background)
        foreground: '#a1a1aa', // match text-zinc-400
        cursor: '#3b82f6',
      },
      fontFamily: 'Consolas, "Courier New", monospace',
      fontSize: 13,
      cursorBlink: true,
    });
    
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);

    term.open(terminalRef.current);
    fitAddon.fit();

    term.writeln('CommandHub Terminal Engine v1.0');
    term.writeln('Backend connection: \x1b[32mOK\x1b[0m');
    term.write('\r\n$ ');

    xtermRef.current = term;

    const handleResize = () => {
      fitAddon.fit();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      term.dispose();
    };
  }, []);

  return (
    <div ref={terminalRef} className="h-full w-full overflow-hidden p-2" />
  );
}
