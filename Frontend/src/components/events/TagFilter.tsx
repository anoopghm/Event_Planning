interface TagFilterProps {
  tags: string[];
  selectedTag: string;
  onSelectTag: (tag: string) => void;
  totalCount: number;
  getCountForTag: (tag: string) => number;
}

export default function TagFilter({
  tags,
  selectedTag,
  onSelectTag,
  totalCount,
  getCountForTag,
}: TagFilterProps) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 pt-1">
      <span className="text-xs font-medium text-neutral-400 mr-1">Tags:</span>
      <button
        type="button"
        onClick={() => onSelectTag("All")}
        className={`rounded-lg px-2.5 py-1 text-xs font-medium transition cursor-pointer ${
          selectedTag === "All"
            ? "bg-neutral-900 text-white"
            : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
        }`}
      >
        All Tags ({totalCount})
      </button>

      {tags.map((tag) => {
        const count = getCountForTag(tag);
        const isActive = selectedTag.toLowerCase() === tag.toLowerCase();

        return (
          <button
            type="button"
            key={tag}
            onClick={() => onSelectTag(tag)}
            className={`rounded-lg px-2.5 py-1 text-xs font-medium transition cursor-pointer ${
              isActive
                ? "bg-red-500 text-white shadow-xs"
                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
            }`}
          >
            #{tag} ({count})
          </button>
        );
      })}
    </div>
  );
}
