import { Navigate } from "react-router-dom";
import { useAuth, landingFor, type Role } from "@/lib/auth";

interface RoleGuardProps {
  allow: Role[];
  children: React.ReactNode;
}

const RoleGuard = ({ allow, children }: RoleGuardProps) => {
  const { role } = useAuth();
  if (!role) return <Navigate to="/login" replace />;
  if (!allow.includes(role)) return <Navigate to={landingFor(role)} replace />;
  return <>{children}</>;
};

export default RoleGuard;
