import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../../App';
import { hasAnyPermission } from '../../services/commonUtills/FormValidations';

const ProtectedRoute = ({ children, permissionCodes, userTypes }) => {
  const { stateAuth } = useContext(AuthContext);

  if (!stateAuth?.isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const user = stateAuth?.user || {};
  const currentType = String(user.typ || '').toUpperCase();
  const hasAllowedType =
    !userTypes || userTypes.map((type) => type.toUpperCase()).includes(currentType);
  const hasRequiredPermission =
    !permissionCodes || hasAnyPermission(user.cds, permissionCodes);

  if (!hasAllowedType || !hasRequiredPermission) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
