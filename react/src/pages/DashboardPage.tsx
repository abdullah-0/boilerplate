import { useAuth } from "@/hooks/useAuth";

const DashboardPage = () => {
  const { user, logout } = useAuth();

  return (
    <main>
      <div className="card">
        <h1>Welcome back</h1>
        <p className="center">{user?.email}</p>
        <button type="button" onClick={logout}>
          Sign out
        </button>
      </div>
    </main>
  );
};

export default DashboardPage;
