import UiIcon from './UiIcon';

type Props = {
  onPlay: () => void;
  onStop: () => void;
  onSave: () => void;
  onLoad: () => void;
};

export default function Toolbar({ onPlay, onStop, onSave, onLoad }: Props) {
  return (
    <div className="toolbar" aria-label="Tombol kontrol project">
      <button className="btn btn-play" onClick={onPlay} aria-label="Jalankan cerita">
        <span className="btn-icon"><UiIcon name="play" /></span><span className="btn-text">Jalan</span>
      </button>
      <button className="btn btn-stop" onClick={onStop} aria-label="Berhenti">
        <span className="btn-icon"><UiIcon name="stop" /></span><span className="btn-text">Stop</span>
      </button>
      <button className="btn btn-save" onClick={onSave} aria-label="Simpan">
        <span className="btn-icon"><UiIcon name="save" /></span><span className="btn-text">Simpan</span>
      </button>
      <button className="btn btn-load" onClick={onLoad} aria-label="Buka project">
        <span className="btn-icon"><UiIcon name="folder" /></span><span className="btn-text">Buka</span>
      </button>
    </div>
  );
}
