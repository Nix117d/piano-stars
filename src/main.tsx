import { render } from 'preact';
import { App } from './App';
import { requestPersistence } from './store/db';

void requestPersistence();

render(<App />, document.getElementById('app')!);
