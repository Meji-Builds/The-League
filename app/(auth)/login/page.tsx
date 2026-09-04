import { LoginForm } from "./LoginForm";

interface Props {
  searchParams: Promise<{ error?: string }>;
}

const URL_ERRORS: Record<string, string> = {
  auth_callback_failed: "Sign-in failed. Please try again.",
  registration_closed:  "Registration is currently closed. You need an invite link to create an account.",
};

export default async function LoginPage({ searchParams }: Props) {
  const { error: errorCode } = await searchParams;
  const initialError = errorCode ? (URL_ERRORS[errorCode] ?? null) : null;

  return <LoginForm initialError={initialError ?? undefined} />;
}
