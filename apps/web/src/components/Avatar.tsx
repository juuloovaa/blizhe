export function Avatar({
  name,
  photoUrl,
  size = 48,
}: {
  name: string;
  photoUrl?: string | null;
  size?: number;
}) {
  const initial = (name || '?').trim().charAt(0).toUpperCase();
  return (
    <div className="avatar" style={{ width: size, height: size, fontSize: size * 0.4 }}>
      {photoUrl ? <img src={photoUrl} alt={name} /> : initial}
    </div>
  );
}
