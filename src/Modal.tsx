// Modal.tsx
import { createMemo, Show, type Component } from 'solid-js';
import './Modal.css';
import { calculateElapsedTime } from './timeUtils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  elapsedTimeMs: number;
  points: number;
}

const Modal: Component<ModalProps> = (props) => {
  const elapsedTime = createMemo(() => calculateElapsedTime(props.elapsedTimeMs));

  return (
    <Show when={props.isOpen}>
      <div class="modal-overlay">
        <div class="modal">
          <h2>Welcome Back!</h2>
          <p>You were away for:</p>
          {elapsedTime().months > 0 && <p> {elapsedTime().months} months</p>}
          {elapsedTime().weeks > 0 && <p> {elapsedTime().weeks} weeks</p>}
          {elapsedTime().days > 0 && <p> {elapsedTime().days} days</p>}
          {elapsedTime().hours > 0 && <p> {elapsedTime().hours} hours</p>}
          {elapsedTime().minutes > 0 && <p> {elapsedTime().minutes} minutes</p>}
          {elapsedTime().seconds > 0 && <p> {elapsedTime().seconds} seconds</p>}
          <p>Points earned: {props.points}</p>
          <button onClick={() => props.onClose()}>Close</button>
        </div>
      </div>
    </Show>
  );
};

export default Modal;
