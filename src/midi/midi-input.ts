import { Emitter, type NoteEvent, type NoteSource, type SourceStatus } from './note-source';

export interface ParsedMidi {
  type: 'noteOn' | 'noteOff';
  midi: number;
  channel: number; // 0-based
}

export function parseMidiMessage(data: Uint8Array): ParsedMidi | null {
  if (data.length < 3) return null;
  const kind = data[0] & 0xf0;
  const channel = data[0] & 0x0f;
  if (kind === 0x90) {
    return { type: data[2] === 0 ? 'noteOff' : 'noteOn', midi: data[1], channel };
  }
  if (kind === 0x80) return { type: 'noteOff', midi: data[1], channel };
  return null;
}

const DRUM_CHANNEL = 9; // MIDI channel 10

export class MidiInput implements NoteSource {
  private notes = new Emitter<NoteEvent>();
  private statuses = new Emitter<SourceStatus>();
  private held = new Set<number>();
  private lastConnected = false;
  private lastName: string | undefined;

  onNoteOn(cb: (e: NoteEvent) => void): () => void {
    return this.notes.subscribe(cb);
  }

  onStatus(cb: (s: SourceStatus) => void): () => void {
    return this.statuses.subscribe(cb);
  }

  async start(): Promise<'ok' | 'unsupported' | 'denied'> {
    if (typeof navigator === 'undefined' || typeof navigator.requestMIDIAccess !== 'function') {
      return 'unsupported';
    }
    let access: MIDIAccess;
    try {
      access = await navigator.requestMIDIAccess({ sysex: false });
    } catch {
      return 'denied';
    }
    const refresh = () => this.refresh(access);
    access.onstatechange = refresh;
    refresh();
    return 'ok';
  }

  private refresh(access: MIDIAccess): void {
    let name: string | undefined;
    let connected = false;
    for (const input of access.inputs.values()) {
      input.onmidimessage = (e) => this.handle(e);
      if (input.state === 'connected') {
        if (!connected) name = input.name ?? undefined;
        connected = true;
      }
    }
    if (!connected) this.held.clear();
    if (connected !== this.lastConnected || name !== this.lastName) {
      this.lastConnected = connected;
      this.lastName = name;
      this.statuses.emit(connected ? { connected, deviceName: name } : { connected });
    }
  }

  private handle(e: MIDIMessageEvent): void {
    if (!e.data) return;
    const msg = parseMidiMessage(e.data);
    if (!msg || msg.channel === DRUM_CHANNEL) return;
    const key = msg.channel * 128 + msg.midi;
    if (msg.type === 'noteOff') {
      this.held.delete(key);
      return;
    }
    if (this.held.has(key)) return;
    this.held.add(key);
    this.notes.emit({ midi: msg.midi, time: e.timeStamp });
  }
}
