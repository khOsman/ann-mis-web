export default function LoadingState({ message = "Loading..." }) {
  return (
    <div className="p-6 text-center text-gray-500">
      {message}
    </div>
  );
}