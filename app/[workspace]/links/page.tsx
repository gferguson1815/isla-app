export default function LinksPage() {
  return (
    <div className="flex-1 flex flex-col">
      {/* Empty state - Story 1.1 will implement this fully */}
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            No links yet
          </h2>
          <p className="text-gray-500 mb-6">
            Create your first short link to get started
          </p>
          <button className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-900">
            Create Link
          </button>
        </div>
      </div>
    </div>
  );
}
