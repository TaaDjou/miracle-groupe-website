function ProgressBar({ value }) {
  return (
    <div className="progress-bar" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
      <div className="progress-bar__fill" style={{ width: `${value}%` }} />
    </div>
  );
}

export default ProgressBar;
