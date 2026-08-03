interface Props {
  timeLeft: number;
  totalTime: number;
}

const SIZE = 168;
const STROKE = 10;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function PlayClock({ timeLeft, totalTime }: Props) {
  const pct = Math.max(0, Math.min(1, timeLeft / totalTime));
  const urgent = timeLeft <= 5;
  const offset = CIRCUMFERENCE * (1 - pct);

  return (
    <div className="flex flex-col items-center gap-2">
      <p className="font-heading text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
        Play Clock
      </p>
      <div
        className={`relative ${urgent ? "clock-urgent" : ""}`}
        style={{ width: SIZE, height: SIZE }}
      >
        <svg
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="-rotate-90"
        >
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="var(--surface-2)"
            strokeWidth={STROKE}
          />
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke={urgent ? "var(--crimson)" : "var(--amber)"}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
            style={{
              transition: "stroke-dashoffset 1s linear, stroke 0.3s ease",
              filter: `drop-shadow(0 0 8px ${urgent ? "var(--crimson)" : "var(--amber)"})`,
            }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className={`font-mono text-4xl font-semibold ${urgent ? "text-[var(--crimson)]" : "text-[var(--amber)]"}`}
          >
            {String(Math.floor(timeLeft / 60)).padStart(2, "0")}:
            {String(timeLeft % 60).padStart(2, "0")}
          </span>
        </div>
      </div>
    </div>
  );
}
