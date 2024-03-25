import { render } from 'preact';

import './style.scss';

export function App() {
	return (
		<div>
			hello world
		</div>
	);
}

render(<App />, document.getElementById('app'));
