export interface NoteEvent {
  midi: number;
  /** ms on the performance.now() clock (Web MIDI event.timeStamp) */
  time: number;
}

export interface SourceStatus {
  connected: boolean;
  deviceName?: string;
}

export interface NoteSource {
  onNoteOn(cb: (e: NoteEvent) => void): () => void;
  onStatus(cb: (s: SourceStatus) => void): () => void;
}

export class Emitter<T> {
  private listeners = new Set<(v: T) => void>();
  subscribe(cb: (v: T) => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }
  emit(v: T): void {
    for (const cb of [...this.listeners]) cb(v);
  }
}
