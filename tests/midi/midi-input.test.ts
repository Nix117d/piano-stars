import { describe, expect, test, vi } from 'vitest';
import { parseMidiMessage, MidiInput } from '../../src/midi/midi-input';
import { FakeSource } from '../../src/midi/fake-source';
import type { NoteEvent, SourceStatus } from '../../src/midi/note-source';

function makeInput(name = 'Digital Keyboard', state = 'connected') {
  return { type: 'input', state, name, onmidimessage: null as ((e: any) => void) | null };
}

function stubMidi(inputs: ReturnType<typeof makeInput>[]) {
  const access: any = { inputs: new Map(inputs.map((i, n) => [String(n), i])), onstatechange: null };
  vi.stubGlobal('navigator', { requestMIDIAccess: vi.fn().mockResolvedValue(access) });
  return access;
}
const msg = (input: { onmidimessage: ((e: any) => void) | null }, ...d: number[]) =>
  input.onmidimessage!({ data: new Uint8Array(d), timeStamp: 123 });

describe('parseMidiMessage', () => {
  test('note-on is parsed with channel', () => {
    expect(parseMidiMessage(new Uint8Array([0x90, 60, 100]))).toEqual({ type: 'noteOn', midi: 60, channel: 0 });
  });
  test('note-on with velocity 0 is a note-off', () => {
    expect(parseMidiMessage(new Uint8Array([0x90, 60, 0]))).toEqual({ type: 'noteOff', midi: 60, channel: 0 });
  });
  test('note-off 0x80 is parsed', () => {
    expect(parseMidiMessage(new Uint8Array([0x81, 62, 40]))?.type).toBe('noteOff');
  });
  test('active sensing, clock and control change return null', () => {
    expect(parseMidiMessage(new Uint8Array([0xfe]))).toBeNull();
    expect(parseMidiMessage(new Uint8Array([0xf8]))).toBeNull();
    expect(parseMidiMessage(new Uint8Array([0xb0, 7, 100]))).toBeNull();
  });
});

describe('MidiInput', () => {
  test('ignores channel 10 and does not re-trigger a held key', async () => {
    const input = makeInput();
    stubMidi([input]);
    const m = new MidiInput();
    const events: NoteEvent[] = [];
    m.onNoteOn((e) => events.push(e));
    expect(await m.start()).toBe('ok');
    msg(input, 0x99, 36, 100);
    expect(events).toEqual([]);
    msg(input, 0x90, 60, 100);
    msg(input, 0x90, 60, 100);
    expect(events).toEqual([{ midi: 60, time: 123 }]);
    msg(input, 0x80, 60, 0);
    msg(input, 0x90, 60, 100);
    expect(events).toHaveLength(2);
  });

  test('reports connect and disconnect from statechange', async () => {
    const access = stubMidi([]);
    const m = new MidiInput();
    const statuses: SourceStatus[] = [];
    m.onStatus((s) => statuses.push(s));
    await m.start();
    const kb = makeInput('Digital Keyboard', 'connected');
    access.inputs.set('9', kb);
    access.onstatechange({ port: kb });
    expect(kb.onmidimessage).toBeTypeOf('function');
    kb.state = 'disconnected';
    access.onstatechange({ port: kb });
    expect(statuses).toEqual([{ connected: true, deviceName: 'Digital Keyboard' }, { connected: false }]);
  });

  test('returns unsupported without requestMIDIAccess and denied on rejection', async () => {
    vi.stubGlobal('navigator', {});
    expect(await new MidiInput().start()).toBe('unsupported');
    vi.stubGlobal('navigator', { requestMIDIAccess: vi.fn().mockRejectedValue(new Error('no')) });
    expect(await new MidiInput().start()).toBe('denied');
  });

  test('reports already-connected input on start', async () => {
    stubMidi([makeInput()]);
    const m = new MidiInput();
    const statuses: SourceStatus[] = [];
    m.onStatus((s) => statuses.push(s));
    await m.start();
    expect(statuses).toEqual([{ connected: true, deviceName: 'Digital Keyboard' }]);
  });
});

describe('FakeSource', () => {
  test('press emits note-on with given or default time; setConnected emits status', () => {
    const f = new FakeSource();
    const events: NoteEvent[] = [];
    const statuses: SourceStatus[] = [];
    const off = f.onNoteOn((e) => events.push(e));
    f.onStatus((s) => statuses.push(s));
    f.press(60, 5);
    f.press(62);
    expect(events[0]).toEqual({ midi: 60, time: 5 });
    expect(typeof events[1].time).toBe('number');
    off();
    f.press(64);
    expect(events).toHaveLength(2);
    f.setConnected(true, 'Fake');
    f.setConnected(false);
    expect(statuses).toEqual([{ connected: true, deviceName: 'Fake' }, { connected: false }]);
  });
});
