const LoadingSpinner = ({ size = 'md' }) => {
  const sizes = {
    sm: 'h-5 w-5',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div className="flex justify-center items-center py-8">
      <div
        className={`${sizes[size] || sizes.md} animate-spin rounded-full border-4 border-gray-200 border-t-primary-600`}
        role="status"
      >
        <span className="sr-only">Loading...</span>
      </div>
    </div>
  );
};

export default LoadingSpinner;
