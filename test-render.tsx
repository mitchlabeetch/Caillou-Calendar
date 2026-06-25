import { renderToString } from 'react-dom/server';
import App from './src/App';
try {
  console.log('Rendering App...');
  renderToString(<App />);
  console.log('Render successful!');
} catch (e) {
  console.error('Render failed:', e);
}
