import { getStatusColor } from '../../utils/format';

const StatusBadge = ({ status }) => {
  return (
    <span className={`badge ${getStatusColor(status)}`}>
      {status}
    </span>
  );
};

export default StatusBadge;
