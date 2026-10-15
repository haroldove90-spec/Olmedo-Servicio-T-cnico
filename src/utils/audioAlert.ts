/**
 * Utilidad de audio sintetizado para alertas en tiempo real
 * Utiliza Web Audio API nativo del navegador para sonar sin requerir archivos mp3 externos.
 */
export function playEmergencyAlertSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();

    // Si el contexto está suspendido (por políticas del navegador), lo reactivamos
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    // Primer tono (campana aguda 880Hz - La5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(880, now);
    osc1.frequency.exponentialRampToValueAtTime(1046.5, now + 0.15); // Do6
    gain1.gain.setValueAtTime(0.4, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    // Segundo tono después de 200ms (1174Hz - Re6)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1174.66, now + 0.2);
    osc2.frequency.exponentialRampToValueAtTime(1318.5, now + 0.35); // Mi6
    gain2.gain.setValueAtTime(0.5, now + 0.2);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.2);
    osc2.stop(now + 0.6);

    // Repetición del acorde de alerta tras 400ms para mayor audibilidad
    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.type = 'triangle';
    osc3.frequency.setValueAtTime(1318.5, now + 0.45);
    osc3.frequency.exponentialRampToValueAtTime(1760, now + 0.7); // La6
    gain3.gain.setValueAtTime(0.45, now + 0.45);
    gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
    osc3.connect(gain3);
    gain3.connect(ctx.destination);
    osc3.start(now + 0.45);
    osc3.stop(now + 0.9);

  } catch (err) {
    console.warn('No se pudo reproducir audio sintetizado:', err);
  }
}

/**
 * Tono de confirmación y despacho para asignación de reportes a técnicos
 * Acorde armónico de tres notas ascendentes (Do-Mi-Sol)
 */
export function playAssignmentAlertSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    // Nota 1: Do5 (523.25 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(523.25, now);
    gain1.gain.setValueAtTime(0.35, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.3);

    // Nota 2: Mi5 (659.25 Hz) tras 120ms
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(659.25, now + 0.12);
    gain2.gain.setValueAtTime(0.4, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.45);

    // Nota 3: Sol5 (783.99 Hz) tras 240ms (resonancia más larga)
    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.type = 'triangle';
    osc3.frequency.setValueAtTime(783.99, now + 0.24);
    gain3.gain.setValueAtTime(0.45, now + 0.24);
    gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
    osc3.connect(gain3);
    gain3.connect(ctx.destination);
    osc3.start(now + 0.24);
    osc3.stop(now + 0.7);

  } catch (err) {
    console.warn('No se pudo reproducir audio de asignación:', err);
  }
}

