function StatCard({ label, value, sublabel }) {
  return (
    <div className="stat-card">
      <div className="stat-card__value">{value}</div>
      <div className="stat-card__label">{label}</div>
      {sublabel && <div className="stat-card__sublabel">{sublabel}</div>}
    </div>
  );
}

export default StatCard;
