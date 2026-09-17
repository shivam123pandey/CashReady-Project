export type LoginQrPayload = {
  role: 'customer' | 'banker';
  username: string;
  password: string;
};

const QR_PREFIX = 'cashready-login://';

export function buildLoginQrPayload(role: LoginQrPayload['role'], username: string, password: string) {
  const payload = { role, username, password };
  return `${QR_PREFIX}${encodeURIComponent(JSON.stringify(payload))}`;
}

export function parseLoginQrPayload(value: string): LoginQrPayload | null {
  if (!value || !value.startsWith(QR_PREFIX)) {
    return null;
  }

  try {
    const raw = decodeURIComponent(value.slice(QR_PREFIX.length));
    const data = JSON.parse(raw) as Partial<LoginQrPayload>;

    if (
      typeof data.role !== 'string' ||
      !['customer', 'banker'].includes(data.role) ||
      typeof data.username !== 'string' ||
      typeof data.password !== 'string' ||
      !data.username.trim() ||
      !data.password.trim()
    ) {
      return null;
    }

    return {
      role: data.role,
      username: data.username.trim(),
      password: data.password,
    };
  } catch {
    return null;
  }
}
