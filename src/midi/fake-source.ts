import { Emitter, type NoteEvent, type NoteSource, type SourceStatus } from './note-source';

/** In-memory NoteSource for tests and the on-screen keyboard fallback. */
export class FakeSource implements NoteSource {
  private notes = new Emitter<NoteEvent>();
  private statuses = new Emitter<SourceStatus>();

  onNoteOn(cb: (e: NoteEvent) => void): () => void {
    return this.notes.subscribe(cb);
  }

  onStatus(cb: (s: SourceStatus) => void): () => void {
    return this.statuses.subscribe(cb);
  }

  press(midi: number, time: number = performance.now()): void {
    this.notes.emit({ midi, time });
  }

  setConnected(connected: boolean, name?: string): void {
    this.statuses.emit(connected ? { connected, deviceName: name } : { connected });
  }
}
