import { MidiInput } from './midi/midi-input';

const NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const noteLabel = (midi: number) => `${NAMES[midi % 12]}${Math.floor(midi / 12) - 1} (${midi})`;

const $ = (id: string) => document.getElementById(id)!;
const midi = new MidiInput();
const recent: string[] = [];

midi.onStatus((s) => {
  $('status').textContent = s.connected ? 'connected' : 'not connected';
  $('device').textContent = s.deviceName ?? '-';
});

midi.onNoteOn((e) => {
  recent.unshift(noteLabel(e.midi));
  recent.length = Math.min(recent.length, 10);
  $('notes').innerHTML = recent.map((n) => `<div>${n}</div>`).join('');
});

$('start').addEventListener('click', async () => {
  const result = await midi.start();
  if (result === 'unsupported') $('status').textContent = 'Web MIDI not supported';
  else if (result === 'denied') $('status').textContent = 'MIDI permission denied';
  else if ($('status').textContent === 'not started') $('status').textContent = 'not connected';
});
